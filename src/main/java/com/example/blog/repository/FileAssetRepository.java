package com.example.blog.repository;

import com.example.blog.entity.FileAsset;
import com.example.blog.entity.FileOwnerType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileAssetRepository extends JpaRepository<FileAsset, Long> {

    Optional<FileAsset> findByOwnerTypeAndOwnerId(FileOwnerType ownerType, Long ownerId);

    List<FileAsset> findByOwnerTypeAndOwnerIdIn(FileOwnerType ownerType, List<Long> ownerIds);

    boolean existsByOwnerTypeAndOwnerId(FileOwnerType ownerType, Long ownerId);

    void deleteByOwnerTypeAndOwnerId(FileOwnerType ownerType, Long ownerId);
}
