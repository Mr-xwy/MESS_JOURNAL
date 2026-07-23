package com.example.blog.repository;

import com.example.blog.entity.AnnouncementRead;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, Long> {

    Optional<AnnouncementRead> findByUserIdAndAnnouncementId(Long userId, Long announcementId);

    void deleteByUserIdAndAnnouncementId(Long userId, Long announcementId);
}
