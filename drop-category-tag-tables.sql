-- ============================================================
-- drop-category-tag-tables.sql
-- 用途：删除 Category / Tag 模块对应的三张物理表。
-- 触发：Category / Tag 模块（实体、仓库、服务、控制器、DTO）
--       已从 Java 代码移除，对应前端 categories.html / tags.html
--       与 categories.js / tags.js 也已删除。JPA ddl-auto: update
--       不会自动 DROP 表，需手动执行本脚本。
--
-- 顺序：先删从表（t_article_tag），再删主表（t_tag、t_category），
--       避免外键约束报错。
--
-- 适用 MySQL 8.x（utf8mb4）。执行前请先备份：
--   mysqldump -u root -p blog t_category t_tag t_article_tag > backup.sql
-- ============================================================

DROP TABLE IF EXISTS `t_article_tag`;
DROP TABLE IF EXISTS `t_tag`;
DROP TABLE IF EXISTS `t_category`;

-- 验证：执行后以下查询应返回 0 行
-- SELECT COUNT(*) FROM t_category;
-- SELECT COUNT(*) FROM t_tag;
-- SELECT COUNT(*) FROM t_article_tag;
