package com.example.blog.service;

import com.example.blog.common.BusinessException;
import com.example.blog.common.Role;
import com.example.blog.entity.Puzzle;
import com.example.blog.repository.ScoreRepository;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PuzzleService {

    private final ScoreRepository scoreRepository;

    /** 每日拼诗榜单每页大小 */
    private static final int LB_SIZE = 50;

    /** 列数上限：避免困难模式词过长导致网格过宽、方块过小 */
    private static final int MAX_COLS = 8;

    /* ===================== 轻松：七言绝句库（4×7，每行一句） ===================== */
    private static final List<Quatrain> QUATRAINS = List.of(
            new Quatrain("zaofabaidicheng", "早发白帝城", "李白", "唐",
                    "朝辞白帝彩云间，千里江陵一日还。\n两岸猿声啼不住，轻舟已过万重山。",
                    "朝辞白帝彩云间千里江陵一日还两岸猿声啼不住轻舟已过万重山"),
            new Quatrain("jueju", "绝句", "杜甫", "唐",
                    "两个黄鹂鸣翠柳，一行白鹭上青天。\n窗含西岭千秋雪，门泊东吴万里船。",
                    "两个黄鹂鸣翠柳一行白鹭上青天窗含西岭千秋雪门泊东吴万里船"),
            new Quatrain("liangzhouci", "凉州词", "王之涣", "唐",
                    "黄河远上白云间，一片孤城万仞山。\n羌笛何须怨杨柳，春风不度玉门关。",
                    "黄河远上白云间一片孤城万仞山羌笛何须怨杨柳春风不度玉门关"),
            new Quatrain("qingming", "清明", "杜牧", "唐",
                    "清明时节雨纷纷，路上行人欲断魂。\n借问酒家何处有，牧童遥指杏花村。",
                    "清明时节雨纷纷路上行人欲断魂借问酒家何处有牧童遥指杏花村"),
            new Quatrain("wanglushanpubu", "望庐山瀑布", "李白", "唐",
                    "日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。",
                    "日照香炉生紫烟遥看瀑布挂前川飞流直下三千尺疑是银河落九天"),
            new Quatrain("fengqiaoyepo", "枫桥夜泊", "张继", "唐",
                    "月落乌啼霜满天，江枫渔火对愁眠。\n姑苏城外寒山寺，夜半钟声到客船。",
                    "月落乌啼霜满天江枫渔火对愁眠姑苏城外寒山寺夜半钟声到客船"),
            new Quatrain("wangdongting", "望洞庭", "刘禹锡", "唐",
                    "湖光秋月两相和，潭面无风镜未磨。\n遥望洞庭山水翠，白银盘里一青螺。",
                    "湖光秋月两相和潭面无风镜未磨遥望洞庭山水翠白银盘里一青螺"),
            new Quatrain("chusai", "出塞", "王昌龄", "唐",
                    "秦时明月汉时关，万里长征人未还。\n但使龙城飞将在，不教胡马度阴山。",
                    "秦时明月汉时关万里长征人未还但使龙城飞将在不教胡马度阴山"));

    /* ===================== 困难：词库（含标点，矩形 + 多空格） ===================== */
    private static final List<Ci> CIS = List.of(
            new Ci("rumengling-1", "如梦令·常记溪亭日暮", "李清照", "宋",
                    "常记溪亭日暮，沉醉不知归路。\n兴尽晚回舟，误入藕花深处。\n争渡，争渡，惊起一滩鸥鹭。",
                    "常记溪亭日暮，沉醉不知归路。兴尽晚回舟，误入藕花深处。争渡，争渡，惊起一滩鸥鹭。"),
            new Ci("rumengling-2", "如梦令·昨夜雨疏风骤", "李清照", "宋",
                    "昨夜雨疏风骤，浓睡不消残酒。\n试问卷帘人，却道海棠依旧。\n知否，知否，应是绿肥红瘦。",
                    "昨夜雨疏风骤，浓睡不消残酒。试问卷帘人，却道海棠依旧。知否，知否，应是绿肥红瘦。"),
            new Ci("xiangjianhuan-1", "相见欢·无言独上西楼", "李煜", "唐",
                    "无言独上西楼，月如钩。\n寂寞梧桐深院锁清秋。\n剪不断，理还乱，是离愁，别是一般滋味在心头。",
                    "无言独上西楼，月如钩。寂寞梧桐深院锁清秋。剪不断，理还乱，是离愁，别是一般滋味在心头。"),
            new Ci("xiangjianhuan-2", "相见欢·林花谢了春红", "李煜", "唐",
                    "林花谢了春红，太匆匆。\n无奈朝来寒雨晚来风。\n胭脂泪，相留醉，几时重。\n自是人生长恨水长东。",
                    "林花谢了春红，太匆匆。无奈朝来寒雨晚来风。胭脂泪，相留醉，几时重。自是人生长恨水长东。"),
            new Ci("huanxisha", "浣溪沙·一曲新词酒一杯", "晏殊", "宋",
                    "一曲新词酒一杯，去年天气旧亭台。\n夕阳西下几时回。\n无可奈何花落去，似曾相识燕归来。\n小园香径独徘徊。",
                    "一曲新词酒一杯，去年天气旧亭台。夕阳西下几时回。无可奈何花落去，似曾相识燕归来。小园香径独徘徊。"));

    /* ===================== 内部素材类 ===================== */
    private static final class Quatrain {
        final String id, title, author, dynasty, full, body;
        Quatrain(String id, String title, String author, String dynasty, String full, String body) {
            if (body.length() != 28) throw new IllegalStateException("七言绝句正文须为 28 字: " + id);
            this.id = id;
            this.title = title;
            this.author = author;
            this.dynasty = dynasty;
            this.full = full;
            this.body = body;
        }
    }

    private static final class Ci {
        final String id, title, author, dynasty, full, chars;
        Ci(String id, String title, String author, String dynasty, String full, String chars) {
            this.id = id;
            this.title = title;
            this.author = author;
            this.dynasty = dynasty;
            this.full = full;
            this.chars = chars;
        }
    }

    /** 今日拼诗：按日期稳定选取（同一天全局一致）；轻松取绝句、困难取词，二者独立选取 */
    public Puzzle getTodayPuzzle() {
        LocalDate today = LocalDate.now();
        int seed = today.getYear() * 370 + today.getDayOfYear();
        int q = Math.floorMod(seed, QUATRAINS.size());
        int c = Math.floorMod((seed / 31) + 7, CIS.size());
        Puzzle p = new Puzzle();
        p.setDate(today.toString());
        p.setEasy(buildQuatrainBoard(QUATRAINS.get(q)));
        p.setHard(buildCiBoard(CIS.get(c)));
        return p;
    }

    private Puzzle.Board buildQuatrainBoard(Quatrain qt) {
        Puzzle.Board b = new Puzzle.Board();
        b.setId(qt.id);
        b.setTitle(qt.title);
        b.setAuthor(qt.author);
        b.setDynasty(qt.dynasty);
        b.setFull(qt.full);
        b.setRows(4);
        b.setCols(7);
        b.setTiles(chars(qt.body));
        b.setBlankIndices(List.of(27));
        b.setReveal(true);
        return b;
    }

    private Puzzle.Board buildCiBoard(Ci ci) {
        List<String> tiles = chars(ci.chars);
        int c = tiles.size();
        int[] rc = chooseRect(c);
        int rows = rc[0], cols = rc[1];
        int blanks = rows * cols - c;
        List<Integer> bi = new ArrayList<>();
        for (int i = rows * cols - blanks; i < rows * cols; i++) bi.add(i);
        Puzzle.Board b = new Puzzle.Board();
        b.setId(ci.id);
        b.setTitle(ci.title);
        b.setAuthor(ci.author);
        b.setDynasty(ci.dynasty);
        b.setFull(ci.full);
        b.setRows(rows);
        b.setCols(cols);
        b.setTiles(tiles);
        b.setBlankIndices(bi);
        b.setReveal(false);
        return b;
    }

    /** 为长度 c 的字符序列选取最接近矩形的行/列：rows*cols >= c+1（至少 1 空格），
     *  优先浪费（空白格）最少，其次更接近正方形，再次行数不超过列数；列宽受 MAX_COLS 限制，
     *  且宽高比不超过 2:1，避免出现 1 列竖条等畸形布局。 */
    private static int[] chooseRect(int c) {
        int bestWaste = Integer.MAX_VALUE;
        int bestRows = 0, bestCols = 0;
        for (int cols = 2; cols <= MAX_COLS; cols++) {
            int rows = (int) Math.ceil((double) (c + 1) / cols);
            if (rows < 2) continue;
            if (Math.max(rows, cols) > 2 * Math.min(rows, cols)) continue; // 宽高比 <= 2:1
            int area = rows * cols;
            int waste = area - c;
            if (waste < 1) continue;
            if (waste < bestWaste) {
                bestWaste = waste;
                bestRows = rows;
                bestCols = cols;
            } else if (waste == bestWaste) {
                int curDiff = Math.abs(rows - cols);
                int bestDiff = Math.abs(bestRows - bestCols);
                if (curDiff < bestDiff || (curDiff == bestDiff && rows < bestRows)) {
                    bestRows = rows;
                    bestCols = cols;
                }
            }
        }
        if (bestRows == 0) {
            bestRows = Math.max(2, (int) Math.ceil((double) (c + 1) / MAX_COLS));
            bestCols = MAX_COLS;
        }
        return new int[] { bestRows, bestCols };
    }

    public String todayDate() {
        return LocalDate.now().toString(); // yyyy-MM-dd
    }

    /** 榜单/成绩 key 兜底（前端总会带 difficulty，此处仅防止缺省） */
    private String defaultKey() {
        return QUATRAINS.get(0).id + "-easy";
    }

    /** 今日榜单（按秒升序，取前 N 名） */
    public List<com.example.blog.entity.Score> leaderboard(String date, String key) {
        if (date == null || date.isBlank()) date = todayDate();
        if (key == null || key.isBlank()) key = defaultKey();
        List<com.example.blog.entity.Score> all =
                scoreRepository.findByDateAndPuzzleKeyOrderBySecondsAsc(date, key);
        return all.size() <= LB_SIZE ? all : all.subList(0, LB_SIZE);
    }

    /** 提交成绩：每人每天每（诗+难度）仅保留最好（最小秒数）成绩 */
    @Transactional
    public Map<String, Object> submit(
            Long userId, String username, String date, String key, int seconds) {
        if (seconds <= 0) throw new BusinessException("用时数据无效");
        if (date == null || date.isBlank()) date = todayDate();
        if (key == null || key.isBlank()) key = defaultKey();

        Optional<com.example.blog.entity.Score> existing =
                scoreRepository.findByUserIdAndDateAndPuzzleKey(userId, date, key);
        com.example.blog.entity.Score best;
        if (existing.isPresent()) {
            best = existing.get();
            if (seconds < best.getSeconds()) {
                best.setSeconds(seconds);
                best = scoreRepository.save(best);
            }
        } else {
            best =
                    com.example.blog.entity.Score.builder()
                            .userId(userId)
                            .username(username)
                            .date(date)
                            .puzzleKey(key)
                            .seconds(seconds)
                            .build();
            best = scoreRepository.save(best);
        }
        int rank = scoreRepository.countBetter(date, key, best.getSeconds());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("best", best.getSeconds());
        m.put("rank", rank);
        m.put("date", date);
        m.put("key", key);
        return m;
    }

    /** 我的成绩与排名 */
    public Map<String, Object> myScore(Long userId, String date, String key) {
        if (date == null || date.isBlank()) date = todayDate();
        if (key == null || key.isBlank()) key = defaultKey();
        Optional<com.example.blog.entity.Score> mine =
                scoreRepository.findByUserIdAndDateAndPuzzleKey(userId, date, key);
        Map<String, Object> m = new LinkedHashMap<>();
        if (mine.isPresent()) {
            int rank = scoreRepository.countBetter(date, key, mine.get().getSeconds());
            m.put("seconds", mine.get().getSeconds());
            m.put("rank", rank);
            m.put("hasScore", true);
        } else {
            m.put("hasScore", false);
        }
        m.put("date", date);
        m.put("key", key);
        return m;
    }

    /** 修改成绩（本人或管理员）：更新用时 */
    @Transactional
    public com.example.blog.entity.Score updateScore(Long id, int seconds, Long userId, String role) {
        if (seconds <= 0) throw new BusinessException("用时数据无效");
        com.example.blog.entity.Score s =
                scoreRepository.findById(id).orElseThrow(() -> new BusinessException("成绩不存在"));
        if (!Role.ADMIN.name().equals(role) && (userId == null || !userId.equals(s.getUserId()))) {
            throw new BusinessException(403, "无权修改该成绩");
        }
        s.setSeconds(seconds);
        return scoreRepository.save(s);
    }

    /** 删除成绩（本人或管理员） */
    @Transactional
    public void deleteScore(Long id, Long userId, String role) {
        com.example.blog.entity.Score s =
                scoreRepository.findById(id).orElseThrow(() -> new BusinessException("成绩不存在"));
        if (!Role.ADMIN.name().equals(role) && (userId == null || !userId.equals(s.getUserId()))) {
            throw new BusinessException(403, "无权删除该成绩");
        }
        scoreRepository.delete(s);
    }

    /** 把字符串拆成单字列表（拼图按字索引，含标点符号） */
    private static List<String> chars(String s) {
        List<String> list = new ArrayList<>();
        for (int i = 0; i < s.length(); i++) list.add(String.valueOf(s.charAt(i)));
        return list;
    }
}
