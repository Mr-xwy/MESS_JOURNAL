package com.example.blog.config;

import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * 启动自愈：把存放 base64 图片的列统一修正为 LONGTEXT。
 *
 * <p>背景：早期实体字段用 columnDefinition="MEDIUMTEXT" 或默认 TEXT，库里对应列可能是
 * TEXT / MEDIUMTEXT / VARCHAR，装不下上传图片的 base64（几 MB），从而报
 * "Data truncation: Data too long for column 'xxx' at row 1"。
 *
 * <p>Hibernate 的 ddl-auto:update 不会修改已存在列的类型；手动 ALTER 又常被遗忘或跑错库。
 * 本组件在应用启动时，对【当前应用真实连接的数据库】自动执行幂等 ALTER，彻底免去手动 SQL。
 *
 * <p>所有语句幂等：列已是 LONGTEXT 时执行无副作用；列不存在或异常时仅记录日志，不影响启动。
 */
@Component
public class ColumnLongtextFixer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ColumnLongtextFixer.class);

    private final DataSource dataSource;

    public ColumnLongtextFixer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** 需要修正为 LONGTEXT 的 (表, 列) 清单：文件资产表 base64 / 订单快照商品图 */
    private static final String[][] TARGETS = {
        {"t_file", "data_url"},
        {"t_order_snapshot", "product_image"},
    };

    @Override
    public void run(String... args) {
        try (var conn = dataSource.getConnection()) {
            String url = conn.getMetaData().getURL();
            if (url == null || !url.toLowerCase().contains("mysql")) {
                log.info("[ColumnLongtextFixer] 非 MySQL 数据源（{}），跳过图片列类型修正", url);
                return;
            }
            try (var stmt = conn.createStatement()) {
                for (var t : TARGETS) {
                    String table = t[0];
                    String col = t[1];
                    String sql = "ALTER TABLE " + table + " MODIFY COLUMN " + col + " LONGTEXT";
                    try {
                        stmt.execute(sql);
                        log.info("[ColumnLongtextFixer] 已确保 {} . {} 为 LONGTEXT", table, col);
                    } catch (Exception e) {
                        log.warn("[ColumnLongtextFixer] {} . {} 修正失败（可忽略，需手动 ALTER）：{}",
                                table, col, e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[ColumnLongtextFixer] 无法获取数据库连接，跳过图片列类型修正：{}", e.getMessage());
        }
    }
}
