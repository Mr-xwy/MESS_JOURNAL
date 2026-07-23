package com.example.blog.entity;

import java.util.List;
import lombok.Data;

/**
 * 每日拼诗（滑动华容道）谜题定义，非持久化。
 * 由 PuzzleService 按日期从内置古诗/词库选取，返回同一天两套棋盘：
 * - 轻松（easy）：七言绝句，4 行 × 7 字 = 28 字，拼成 4×7 矩形，每行一句诗；
 *                 末尾固定留 1 个空格（blankIndices=[27]），通关时在空格处补全末字（reveal=true）。
 * - 困难（hard）：长短不一的“词”，连同标点符号一并拼入矩形网格；
 *                 若无法恰好差一个凑成矩形，则允许多个空白格（blankIndices 为末尾若干格）。
 */
@Data
public class Puzzle {

    /** 谜题日期 yyyy-MM-dd（按本地日） */
    private String date;

    /** 轻松难度棋盘（七言绝句 4×7） */
    private Board easy;

    /** 困难难度棋盘（长短词，矩形 + 多空格） */
    private Board hard;

    /** 单个难度的拼图棋盘描述 */
    @Data
    public static class Board {
        /** 诗/词标识，如 zaofabaidicheng（榜单 key 前缀） */
        private String id;
        /** 诗题 */
        private String title;
        /** 作者 */
        private String author;
        /** 朝代，如 唐 / 宋 */
        private String dynasty;
        /** 全诗正文（含标点与换行），用于通关后展示与「查看原诗」提示 */
        private String full;
        /** 行数 */
        private int rows;
        /** 列数 */
        private int cols;
        /** 已解顺序的逐字列表（行优先），不含空白格；困难模式含标点符号 */
        private List<String> tiles;
        /** 空白格在网格中的下标（行优先） */
        private List<Integer> blankIndices;
        /** 通关时是否在空格处显示 tiles 对应字（仅轻松单空格用：末字补全整诗） */
        private boolean reveal;
    }
}
