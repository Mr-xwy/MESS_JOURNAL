package com.example.blog.config;

import com.example.blog.entity.FileOwnerType;
import com.example.blog.entity.OrderSnapshot;
import com.example.blog.repository.OrderSnapshotRepository;
import com.example.blog.service.FileAssetService;
import java.math.BigDecimal;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 一次性数据迁移（幂等、可重复执行）：
 * 把重构前内嵌在业务表中的 base64 大字段（头像 / 文物图 / 商品图 / 订单快照）
 * 迁到新表 t_file / t_order_snapshot。
 *
 * <p>重构后这些列在实体中已不再映射（@Transient / 已移除），但库里旧列仍存在。
 * 本迁移仅“补建”新表数据，不删旧列；确认无误后可由 DBA 手动 DROP 旧列。
 *
 * <p>幂等保证：仅当目标新表尚无对应记录时才写入；若已存在（包括重构后用户新上传的），
 * 绝不回写旧列里的过期数据，避免覆盖用户后续更新。
 */
@Slf4j
@Component
@Order(20)
public class DbMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbc;
    private final FileAssetService fileAssetService;
    private final OrderSnapshotRepository orderSnapshotRepository;

    public DbMigrationRunner(
            JdbcTemplate jdbc,
            FileAssetService fileAssetService,
            OrderSnapshotRepository orderSnapshotRepository) {
        this.jdbc = jdbc;
        this.fileAssetService = fileAssetService;
        this.orderSnapshotRepository = orderSnapshotRepository;
    }

    @Override
    public void run(String... args) {
        migrateUserAvatars();
        migrateRelicImages();
        migrateProductImages();
        migrateOrderSnapshots();
    }

    private void migrateUserAvatars() {
        try {
            List<Object[]> rows = jdbc.query(
                    "SELECT id, avatar FROM t_user WHERE avatar IS NOT NULL AND avatar <> ''",
                    (rs, i) -> new Object[] {rs.getLong("id"), rs.getString("avatar")});
            for (Object[] row : rows) {
                Long id = (Long) row[0];
                String data = (String) row[1];
                if (!fileAssetService.exists(FileOwnerType.AVATAR, id)) {
                    fileAssetService.upsert(FileOwnerType.AVATAR, id, data);
                }
            }
            if (!rows.isEmpty()) log.info("[DbMigration] 迁移用户头像 {} 条", rows.size());
        } catch (Exception e) {
            log.warn("[DbMigration] 迁移用户头像跳过：{}", e.getMessage());
        }
    }

    private void migrateRelicImages() {
        try {
            List<Object[]> rows = jdbc.query(
                    "SELECT id, image_svg FROM t_relic WHERE image_svg IS NOT NULL AND image_svg <> ''",
                    (rs, i) -> new Object[] {rs.getLong("id"), rs.getString("image_svg")});
            for (Object[] row : rows) {
                Long id = (Long) row[0];
                String data = (String) row[1];
                if (!fileAssetService.exists(FileOwnerType.RELIC_IMAGE, id)) {
                    fileAssetService.upsert(FileOwnerType.RELIC_IMAGE, id, data);
                }
            }
            if (!rows.isEmpty()) log.info("[DbMigration] 迁移文物图片 {} 条", rows.size());
        } catch (Exception e) {
            log.warn("[DbMigration] 迁移文物图片跳过：{}", e.getMessage());
        }
    }

    private void migrateProductImages() {
        try {
            List<Object[]> rows = jdbc.query(
                    "SELECT id, image FROM t_product WHERE image IS NOT NULL AND image <> ''",
                    (rs, i) -> new Object[] {rs.getLong("id"), rs.getString("image")});
            for (Object[] row : rows) {
                Long id = (Long) row[0];
                String data = (String) row[1];
                if (!fileAssetService.exists(FileOwnerType.PRODUCT_IMAGE, id)) {
                    fileAssetService.upsert(FileOwnerType.PRODUCT_IMAGE, id, data);
                }
            }
            if (!rows.isEmpty()) log.info("[DbMigration] 迁移商品图片 {} 条", rows.size());
        } catch (Exception e) {
            log.warn("[DbMigration] 迁移商品图片跳过：{}", e.getMessage());
        }
    }

    private void migrateOrderSnapshots() {
        try {
            List<Object[]> rows = jdbc.query(
                    "SELECT id, product_title, product_image, price, seller_name, buyer_name "
                            + "FROM t_order WHERE product_title IS NOT NULL",
                    (rs, i) -> new Object[] {
                            rs.getLong("id"),
                            rs.getString("product_title"),
                            rs.getString("product_image"),
                            rs.getBigDecimal("price"),
                            rs.getString("seller_name"),
                            rs.getString("buyer_name")
                    });
            for (Object[] row : rows) {
                Long orderId = (Long) row[0];
                if (orderSnapshotRepository.findByOrderId(orderId).isPresent()) continue;
                orderSnapshotRepository.save(OrderSnapshot.builder()
                        .orderId(orderId)
                        .productTitle((String) row[1])
                        .productImage((String) row[2])
                        .price(row[3] == null ? BigDecimal.ZERO : (BigDecimal) row[3])
                        .sellerName((String) row[4])
                        .buyerName((String) row[5])
                        .build());
            }
            if (!rows.isEmpty()) log.info("[DbMigration] 迁移订单快照 {} 条", rows.size());
        } catch (Exception e) {
            log.warn("[DbMigration] 迁移订单快照跳过：{}", e.getMessage());
        }
    }
}
