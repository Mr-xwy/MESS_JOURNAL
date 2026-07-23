-- ============================================================
-- 删除 Bookmark / Comment / Letter 三模块对应的物理表
-- 适用：MySQL（与本项目 JPA 实体 @Table 名一致）
-- 说明：JPA ddl-auto=update 不会自动 DROP 表，必须手动执行。
--       这三个实体均用 Long 字段（targetId / articleId / authorId）存关联，
--       没有指向其他业务表的真实外键，可安全直接删除，无需先删子表。
-- 建议：执行前先备份（见底部命令）。
-- ============================================================

-- 1) 读者来信
DROP TABLE IF EXISTS t_letter;

-- 2) 评论
DROP TABLE IF EXISTS t_comment;

-- 3) 收藏
DROP TABLE IF EXISTS t_bookmark;

-- ============================================================
-- 验证
-- ============================================================
-- SELECT TABLE_NAME FROM information_schema.tables
-- WHERE table_schema = DATABASE()
--   AND TABLE_NAME IN ('t_letter', 't_comment', 't_bookmark');
-- 预期：返回 0 行（三张表均已不存在）。

-- ============================================================
-- 备份（执行删除前建议先跑）
-- ============================================================
-- mysqldump -u<用户> -p<密码> <数据库名> t_letter t_comment t_bookmark > bookmark_comment_letter_backup.sql
