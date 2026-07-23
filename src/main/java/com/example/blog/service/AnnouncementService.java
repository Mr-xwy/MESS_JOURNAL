package com.example.blog.service;

import com.example.blog.common.BusinessException;
import com.example.blog.dto.AnnouncementRequest;
import com.example.blog.entity.Announcement;
import com.example.blog.entity.AnnouncementRead;
import com.example.blog.repository.AnnouncementReadRepository;
import com.example.blog.repository.AnnouncementRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementReadRepository announcementReadRepository;

    /** 公告列表（公开）：置顶优先，并标记当前用户是否已读 */
    public List<Map<String, Object>> list(Long userId) {
        List<Announcement> all = announcementRepository.findAllByOrderByPinnedDescCreatedAtDesc();
        return all.stream()
                .map(
                        a -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("announcement", a);
                            boolean read =
                                    userId != null
                                            && announcementReadRepository
                                                    .findByUserIdAndAnnouncementId(userId, a.getId())
                                                    .isPresent();
                            m.put("read", read);
                            return m;
                        })
                .collect(Collectors.toList());
    }

    public Announcement get(Long id) {
        return announcementRepository.findById(id).orElseThrow(() -> new BusinessException("公告不存在"));
    }

    /** 标记已读（需登录） */
    @Transactional
    public void markRead(Long id, Long userId) {
        requireLogin(userId);
        if (announcementReadRepository.findByUserIdAndAnnouncementId(userId, id).isEmpty()) {
            announcementReadRepository.save(
                    AnnouncementRead.builder().userId(userId).announcementId(id).build());
        }
    }

    @Transactional
    public Announcement create(AnnouncementRequest req, Long userId, String username, String role) {
        requireAdmin(role);
        return announcementRepository.save(
                Announcement.builder()
                        .title(req.getTitle())
                        .content(req.getContent())
                        .publisherId(userId)
                        .publisherName(username)
                        .pinned(req.getPinned() == null ? false : req.getPinned())
                        .build());
    }

    @Transactional
    public Announcement update(Long id, AnnouncementRequest req, String role) {
        requireAdmin(role);
        Announcement a = get(id);
        a.setTitle(req.getTitle());
        a.setContent(req.getContent());
        if (req.getPinned() != null) a.setPinned(req.getPinned());
        return announcementRepository.save(a);
    }

    @Transactional
    public void delete(Long id, String role) {
        requireAdmin(role);
        announcementRepository.deleteById(id);
    }

    private void requireLogin(Long userId) {
        if (userId == null) throw new BusinessException(401, "请先登录");
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) throw new BusinessException(403, "仅管理员可管理公告");
    }
}
