package com.example.blog.service;

import com.example.blog.entity.FileAsset;
import com.example.blog.entity.FileOwnerType;
import com.example.blog.repository.FileAssetRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 文件资产读写服务：统一处理头像 / 文物图 / 商品图在 t_file 中的存取。
 * 业务实体不再持有 base64 列，仅通过本服务按 (ownerType, ownerId) 装配。
 */
@Service
@RequiredArgsConstructor
public class FileAssetService {

    private final FileAssetRepository repo;

    /** 读取某归属对象的文件（无则返回空串，前端按空串显示占位） */
    public String load(FileOwnerType type, Long ownerId) {
        return repo.findByOwnerTypeAndOwnerId(type, ownerId)
                .map(FileAsset::getDataUrl)
                .orElse("");
    }

    /** 批量读取，返回 ownerId -> dataUrl，避免列表接口出现 N+1 查询 */
    public Map<Long, String> loadBatch(FileOwnerType type, List<Long> ownerIds) {
        Map<Long, String> map = new HashMap<>();
        if (ownerIds == null || ownerIds.isEmpty()) return map;
        repo.findByOwnerTypeAndOwnerIdIn(type, ownerIds)
                .forEach(f -> map.put(f.getOwnerId(), f.getDataUrl()));
        return map;
    }

    public boolean exists(FileOwnerType type, Long ownerId) {
        return repo.existsByOwnerTypeAndOwnerId(type, ownerId);
    }

    /** 写入或覆盖；dataUrl 为空时删除该文件行（用于“移除图片”） */
    @Transactional
    public void upsert(FileOwnerType type, Long ownerId, String dataUrl) {
        if (dataUrl == null || dataUrl.isBlank()) {
            repo.deleteByOwnerTypeAndOwnerId(type, ownerId);
            return;
        }
        repo.findByOwnerTypeAndOwnerId(type, ownerId)
                .ifPresentOrElse(
                        f -> {
                            f.setDataUrl(dataUrl);
                            repo.save(f);
                        },
                        () -> repo.save(FileAsset.builder()
                                .ownerType(type)
                                .ownerId(ownerId)
                                .dataUrl(dataUrl)
                                .build()));
    }

    @Transactional
    public void delete(FileOwnerType type, Long ownerId) {
        repo.deleteByOwnerTypeAndOwnerId(type, ownerId);
    }
}
