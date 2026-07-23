-- ============================================================
-- 一次性修复：把 t_relic.image_svg / t_product.image / t_order.product_image 升级到 LONGTEXT
-- 原因：这些字段原本是 MEDIUMTEXT（上限 16MB）或更小的类型；
--       当用户上传较大图片的 base64 时仍可能触发：
--       Data too long for column 'image_svg' at row 1 / 'image' at row 1 / 'product_image' at row 1
-- 修复：@Lob 让 Hibernate 在 MySQL 下映射为 LONGTEXT（最大 4GB）。
--       但 Hibernate ddl-auto: update 不会改已存在列类型，必须手动执行本脚本。
-- 适用：MySQL 5.7+ / 8.0+
-- 注意：执行前最好先 SHOW COLUMNS 看看现状；脚本幂等，可重复执行
--
-- ✅ 自 v当前 起，应用启动时（com.example.blog.config.ColumnLongtextFixer）
--    会自动对【当前连接的库】执行下列 ALTER，无需再手动跑本脚本。
--    本文件仅作为兜底/离线修复使用；重复执行幂等，无副作用。
-- ============================================================

-- 0) 看下当前列是什么类型（执行后看输出即可，不要复制下面三行去跑）
-- SHOW COLUMNS FROM t_relic  WHERE Field = 'image_svg';
-- SHOW COLUMNS FROM t_product WHERE Field = 'image';
-- SHOW COLUMNS FROM t_order   WHERE Field = 'product_image';

-- 1) 文物图片列升级到 LONGTEXT
ALTER TABLE t_relic MODIFY COLUMN image_svg LONGTEXT;

-- 2) 商品图片列升级到 LONGTEXT
ALTER TABLE t_product MODIFY COLUMN image LONGTEXT;

-- 3) 订单快照商品图升级到 LONGTEXT
ALTER TABLE t_order MODIFY COLUMN product_image LONGTEXT;

-- 4) 确认改成功（应看到 Type = longtext）
-- SHOW COLUMNS FROM t_relic  WHERE Field = 'image_svg';
-- SHOW COLUMNS FROM t_product WHERE Field = 'image';
-- SHOW COLUMNS FROM t_order   WHERE Field = 'product_image';
