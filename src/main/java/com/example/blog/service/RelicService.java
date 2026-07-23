package com.example.blog.service;

import com.example.blog.common.BusinessException;
import com.example.blog.common.Role;
import com.example.blog.dto.RelicRequest;
import com.example.blog.dto.ReviewRequest;
import com.example.blog.entity.*;
import com.example.blog.repository.RelicRepository;
import com.example.blog.repository.UserRepository;
import com.example.blog.service.FileAssetService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RelicService {

    private final RelicRepository relicRepository;
    private final UserRepository userRepository;
    private final FileAssetService fileAssetService;

    /** 公开列表：仅已上线文物，分页（最新在前） */
    public Page<Relic> listPublished(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Relic> p = relicRepository.findByStatus(RelicStatus.PUBLISHED, pageable);
        attachImages(p.getContent());
        return p;
    }

    /** 我的提交（含待审 / 驳回） */
    public List<Relic> listMine(Long userId) {
        List<Relic> list = relicRepository.findByAuthorId(userId);
        attachImages(list);
        return list;
    }

    /** 详情：已上线公开；待审 / 驳回仅作者或审核人员可见 */
    public Relic detail(Long id, Long userId, String role) {
        Relic r = relicRepository.findById(id).orElseThrow(() -> new BusinessException("文物不存在"));
        if (r.getStatus() != RelicStatus.PUBLISHED) {
            boolean canSee =
                    userId != null && (userId.equals(r.getAuthorId()) || isModeratorOrAdmin(role));
            if (!canSee) throw new BusinessException(403, "该文物尚未上线，暂不可见");
        }
        attachImage(r);
        return r;
    }

    /** 创建：管理员 / 审核员直接上线；普通用户提交后进入待审队列 */
    @Transactional
    public Relic create(RelicRequest req, Long userId, String username, String role) {
        userRepository.findById(userId).orElseThrow(() -> new BusinessException("用户不存在"));
        if (req.getImage() != null && req.getImage().length() > 5_000_000) {
            throw new BusinessException("文物图片过大，请压缩后再上传（建议小于 3.5MB）");
        }
        Relic r = new Relic();
        r.setTitle(req.getTitle());
        r.setDynasty(req.getDynasty());
        r.setMaterial(req.getMaterial());
        r.setOrigin(req.getOrigin());
        r.setLocation(req.getLocation());
        r.setDescription(req.getDescription());
        r.setAuthorId(userId);
        r.setAuthorName(username);
        r.setSubmitterNote(req.getSubmitterNote());
        if (isModeratorOrAdmin(role)) {
            r.setStatus(RelicStatus.PUBLISHED);
            r.setPublishedAt(LocalDateTime.now());
            r.setReviewedBy(username);
            r.setReviewedAt(LocalDateTime.now());
        } else {
            r.setStatus(RelicStatus.PENDING);
        }
        Relic saved = relicRepository.save(r);
        fileAssetService.upsert(FileOwnerType.RELIC_IMAGE, saved.getId(), req.getImage());
        saved.setImage(req.getImage());
        return saved;
    }

    /** 审核信息箱：仅管理员 / 审核员可见的待审队列（先提交先审） */
    public List<Relic> inbox(String role) {
        if (!isModeratorOrAdmin(role)) throw new BusinessException(403, "无权限访问信息箱");
        List<Relic> list = relicRepository.findByStatusOrderByCreatedAtAsc(RelicStatus.PENDING);
        attachImages(list);
        return list;
    }

    /** 审核：通过 = 上线；驳回 = 退回并留意见 */
    @Transactional
    public Relic review(Long id, ReviewRequest req, String reviewer, String role) {
        if (!isModeratorOrAdmin(role)) throw new BusinessException(403, "无权限进行审核");
        Relic r = relicRepository.findById(id).orElseThrow(() -> new BusinessException("文物不存在"));
        String action = req.getAction() == null ? "" : req.getAction().toUpperCase();
        if ("APPROVE".equals(action)) {
            r.setStatus(RelicStatus.PUBLISHED);
            r.setPublishedAt(LocalDateTime.now());
            r.setReviewNote(null);
        } else if ("REJECT".equals(action)) {
            r.setStatus(RelicStatus.REJECTED);
            r.setReviewNote(req.getNote());
        } else {
            throw new BusinessException("不支持的审核动作");
        }
        r.setReviewedBy(reviewer);
        r.setReviewedAt(LocalDateTime.now());
        Relic saved = relicRepository.save(r);
        attachImage(saved);
        return saved;
    }

    /** 编辑文物（作者本人或管理员）：替换可编辑字段，保留审核状态 */
    @Transactional
    public Relic update(Long id, RelicRequest req, Long userId, String role) {
        Relic r = relicRepository.findById(id).orElseThrow(() -> new BusinessException("文物不存在"));
        if (!Role.ADMIN.name().equals(role) && (userId == null || !userId.equals(r.getAuthorId()))) {
            throw new BusinessException(403, "无权编辑该文物");
        }
        r.setTitle(req.getTitle());
        r.setDynasty(req.getDynasty());
        r.setMaterial(req.getMaterial());
        r.setOrigin(req.getOrigin());
        r.setLocation(req.getLocation());
        r.setDescription(req.getDescription());
        r.setSubmitterNote(req.getSubmitterNote());
        if (req.getImage() != null) {
            if (req.getImage().length() > 3_200_000) {
                throw new BusinessException("文物图片过大，请压缩后再上传（建议小于 2MB）");
            }
            fileAssetService.upsert(FileOwnerType.RELIC_IMAGE, id, req.getImage());
        }
        Relic saved = relicRepository.save(r);
        saved.setImage(fileAssetService.load(FileOwnerType.RELIC_IMAGE, id));
        return saved;
    }

    /** 删除：作者本人或管理员 */
    @Transactional
    public void delete(Long id, Long userId, String role) {
        Relic r = relicRepository.findById(id).orElseThrow(() -> new BusinessException("文物不存在"));
        if (!Role.ADMIN.name().equals(role) && (userId == null || !userId.equals(r.getAuthorId()))) {
            throw new BusinessException(403, "无权删除该文物");
        }
        relicRepository.delete(r);
    }

    private void attachImage(Relic r) {
        r.setImage(fileAssetService.load(FileOwnerType.RELIC_IMAGE, r.getId()));
    }

    private void attachImages(List<Relic> list) {
        if (list == null) return;
        list.forEach(this::attachImage);
    }

    private boolean isModeratorOrAdmin(String role) {
        return Role.ADMIN.name().equals(role) || Role.MODERATOR.name().equals(role);
    }
}
