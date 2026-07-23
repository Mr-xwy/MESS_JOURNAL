package com.example.blog.service;

import com.example.blog.common.BusinessException;
import com.example.blog.common.Role;
import com.example.blog.dto.ArticleRequest;
import com.example.blog.entity.*;
import com.example.blog.repository.ArticleRepository;
import com.example.blog.repository.FavoriteRepository;
import com.example.blog.repository.LikeRepository;
import com.example.blog.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final LikeRepository likeRepository;
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;

    /** 发布 / 存草稿 */
    @Transactional
    public Article create(ArticleRequest req, Long userId, String username) {
        User author = userRepository.findById(userId).orElseThrow(() -> new BusinessException("用户不存在"));
        Article a = new Article();
        a.setTitle(req.getTitle());
        a.setContent(req.getContent());
        a.setSummary(req.getSummary());
        a.setCategory(req.getCategory());
        a.setAuthorId(author.getId());
        a.setAuthorName(author.getNickname());
        boolean draft = Boolean.TRUE.equals(req.getDraft());
        a.setStatus(draft ? ArticleStatus.DRAFT : ArticleStatus.PUBLISHED);
        if (!draft) a.setPublishedAt(LocalDateTime.now());
        return articleRepository.save(a);
    }

    /** 列表：公开只查 PUBLISHED；mine=true 查当前用户全部（含草稿） */
    public Page<Article> list(String category, String keyword, Long authorId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Article> spec =
                (root, query, cb) -> {
                    List<Predicate> ps = new ArrayList<>();
                    if (category != null && !category.isBlank()) {
                        ps.add(cb.equal(root.get("category"), category));
                    }
                    if (keyword != null && !keyword.isBlank()) {
                        String like = "%" + keyword + "%";
                        ps.add(
                                cb.or(
                                        cb.like(root.get("title"), like),
                                        cb.like(root.get("summary"), like),
                                        cb.like(root.get("content"), like)));
                    }
                    if (authorId != null) {
                        ps.add(cb.equal(root.get("authorId"), authorId));
                    } else {
                        ps.add(cb.equal(root.get("status"), ArticleStatus.PUBLISHED));
                    }
                    return cb.and(ps.toArray(new Predicate[0]));
                };
        return articleRepository.findAll(spec, pageable);
    }

    /** 详情：下线文章仅作者/审核可见；草稿仅作者可见。同时返回当前用户是否已点赞 */
    public Map<String, Object> detail(Long id, Long userId, String role) {
        Article a = articleRepository.findById(id).orElseThrow(() -> new BusinessException("文章不存在"));
        if (a.getStatus() == ArticleStatus.OFFLINE) {
            boolean canSee =
                    userId != null && (userId.equals(a.getAuthorId()) || isModeratorOrAdmin(role));
            if (!canSee) throw new BusinessException(403, "该文章已被下线，暂不可见");
        }
        if (a.getStatus() == ArticleStatus.DRAFT) {
            if (userId == null || !userId.equals(a.getAuthorId())) {
                throw new BusinessException(403, "无权访问该草稿");
            }
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("article", a);
        boolean liked =
                userId != null && likeRepository.findByUserIdAndArticleId(userId, a.getId()).isPresent();
        m.put("liked", liked);
        boolean favorited =
                userId != null && favoriteRepository.findByUserIdAndArticleId(userId, a.getId()).isPresent();
        m.put("favorited", favorited);
        return m;
    }

    /** 修改：作者本人或 ADMIN 可改 */
    @Transactional
    public Article update(Long id, ArticleRequest req, Long userId, String role) {
        Article a = articleRepository.findById(id).orElseThrow(() -> new BusinessException("文章不存在"));
        if (!canEdit(a, userId, role)) throw new BusinessException(403, "无权修改该文章");

        a.setTitle(req.getTitle());
        if (req.getContent() != null) a.setContent(req.getContent());
        if (req.getSummary() != null) a.setSummary(req.getSummary());
        if (req.getCategory() != null) a.setCategory(req.getCategory());

        // 草稿 -> 发布
        if (a.getStatus() == ArticleStatus.DRAFT && !Boolean.TRUE.equals(req.getDraft())) {
            a.setStatus(ArticleStatus.PUBLISHED);
            a.setPublishedAt(LocalDateTime.now());
        }
        return articleRepository.save(a);
    }

    /** 删除：作者本人或 ADMIN 可删（审核员只能下线，不能删） */
    @Transactional
    public void delete(Long id, Long userId, String role) {
        Article a = articleRepository.findById(id).orElseThrow(() -> new BusinessException("文章不存在"));
        if (!canEdit(a, userId, role)) throw new BusinessException(403, "无权删除该文章");
        articleRepository.delete(a);
    }

    /** 状态变更（下线/恢复）：仅 MODERATOR 与 ADMIN */
    @Transactional
    public Article changeStatus(Long id, ArticleStatus newStatus, Long userId, String role) {
        if (!isModeratorOrAdmin(role)) throw new BusinessException(403, "无权限进行下线/恢复操作");
        Article a = articleRepository.findById(id).orElseThrow(() -> new BusinessException("文章不存在"));
        if (newStatus == ArticleStatus.OFFLINE) {
            a.setStatus(ArticleStatus.OFFLINE);
        } else if (newStatus == ArticleStatus.PUBLISHED) {
            a.setStatus(ArticleStatus.PUBLISHED);
            if (a.getPublishedAt() == null) a.setPublishedAt(LocalDateTime.now());
        } else {
            throw new BusinessException("不支持的状态");
        }
        return articleRepository.save(a);
    }

    /** 点赞 / 取消点赞（Toggle），按用户去重 */
    @Transactional
    public Map<String, Object> toggleLike(Long articleId, Long userId) {
        Article a =
                articleRepository.findById(articleId).orElseThrow(() -> new BusinessException("文章不存在"));
        if (a.getStatus() != ArticleStatus.PUBLISHED) throw new BusinessException("只有已发布文章可点赞");

        boolean liked;
        if (likeRepository.findByUserIdAndArticleId(userId, articleId).isPresent()) {
            likeRepository.deleteByUserIdAndArticleId(userId, articleId);
            a.setLikeCount(Math.max(0, a.getLikeCount() - 1));
            liked = false;
        } else {
            LikeRecord r = LikeRecord.builder().userId(userId).articleId(articleId).build();
            likeRepository.save(r);
            a.setLikeCount(a.getLikeCount() + 1);
            liked = true;
        }
        articleRepository.save(a);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("likeCount", a.getLikeCount());
        m.put("liked", liked);
        return m;
    }

    /** 收藏 / 取消收藏（Toggle），按用户去重；返回最新收藏状态 */
    @Transactional
    public Map<String, Object> toggleFavorite(Long articleId, Long userId) {
        articleRepository.findById(articleId).orElseThrow(() -> new BusinessException("文章不存在"));
        boolean favorited;
        if (favoriteRepository.findByUserIdAndArticleId(userId, articleId).isPresent()) {
            favoriteRepository.deleteByUserIdAndArticleId(userId, articleId);
            favorited = false;
        } else {
            Favorite f = Favorite.builder().userId(userId).articleId(articleId).build();
            favoriteRepository.save(f);
            favorited = true;
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("favorited", favorited);
        return m;
    }

    /** 我的收藏：按收藏时间倒序返回收藏的文章 */
    public List<Article> listFavorites(Long userId) {
        List<Favorite> favs = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (favs.isEmpty()) return List.of();
        List<Long> ids = favs.stream().map(Favorite::getArticleId).collect(Collectors.toList());
        List<Article> articles = articleRepository.findByIdIn(ids);
        Map<Long, Article> map = articles.stream().collect(Collectors.toMap(Article::getId, a -> a));
        List<Article> ordered = new ArrayList<>();
        for (Favorite f : favs) {
            Article art = map.get(f.getArticleId());
            if (art != null) ordered.add(art);
        }
        return ordered;
    }

    /** 热点榜：已发布文章按点赞量倒序 */
    public List<Article> hot(int limit) {
        Pageable pageable =
                PageRequest.of(
                        0,
                        limit,
                        Sort.by(Sort.Direction.DESC, "likeCount")
                                .and(Sort.by(Sort.Direction.DESC, "publishedAt")));
        return articleRepository
                .findAll(
                        (root, query, cb) -> cb.equal(root.get("status"), ArticleStatus.PUBLISHED), pageable)
                .getContent();
    }

    private boolean isModeratorOrAdmin(String role) {
        return Role.ADMIN.name().equals(role) || Role.MODERATOR.name().equals(role);
    }

    private boolean canEdit(Article a, Long userId, String role) {
        if (Role.ADMIN.name().equals(role)) return true;
        return userId != null && userId.equals(a.getAuthorId());
    }
}
