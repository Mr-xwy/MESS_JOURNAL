-- ============================================================
-- 一次性修复：把 t_user.avatar 升级到 LONGTEXT
-- 原因：原本字段可能是 VARCHAR(255) 或 TEXT（~64KB），装不下 base64 头像
--       表现：Data too long for column 'avatar' at row 1
-- 修复：Hibernate ddl-auto: update 不会改已存在列类型，必须手动执行本脚本
-- 适用：MySQL 5.7+ / 8.0+
-- 注意：执行前最好先 SELECT avatar 看看现状；脚本幂等，可重复执行
--
-- ✅ 自 v当前 起，应用启动时（com.example.blog.config.ColumnLongtextFixer）
--    会自动对【当前连接的库】执行下列 ALTER，无需再手动跑本脚本。
--    本文件仅作为兜底/离线修复使用；重复执行幂等，无副作用。
-- ============================================================

-- 1) 看下当前 avatar 列是什么类型（执行后看输出即可，不要复制下面这行执行）
-- SHOW COLUMNS FROM t_user WHERE Field = 'avatar';

-- 2) 一键升级到 LONGTEXT（最大 4GB，对头像绰绰有余）
ALTER TABLE t_user MODIFY COLUMN avatar LONGTEXT;

-- 3) 确认改成功
-- SHOW COLUMNS FROM t_user WHERE Field = 'avatar';
-- 应该看到 Type = longtext
