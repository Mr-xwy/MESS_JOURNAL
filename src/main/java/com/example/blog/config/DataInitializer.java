package com.example.blog.config;

import com.example.blog.common.Role;
import com.example.blog.entity.Article;
import com.example.blog.entity.ArticleStatus;
import com.example.blog.entity.Product;
import com.example.blog.entity.ProductStatus;
import com.example.blog.entity.Relic;
import com.example.blog.entity.RelicStatus;
import com.example.blog.entity.User;
import com.example.blog.repository.ArticleRepository;
import com.example.blog.repository.OrderRepository;
import com.example.blog.repository.ProductRepository;
import com.example.blog.repository.RelicRepository;
import com.example.blog.repository.UserRepository;
import com.example.blog.util.Md5Util;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
  * 启动种子数据：预置三种权限的账号 + 几篇示例文章 + 5 件著名文物，方便团队一打开就能体验权限差异与线上博物馆。 账号： admin / admin123 (ADMIN 最高权限)
  * moderator / mod123 (MODERATOR 可下线他人文章/审核文物) alice / user123 (USER 普通用户) bob / user123 (USER 普通用户)
  */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ArticleRepository articleRepository;
    private final RelicRepository relicRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = saveUser("admin", "admin123", "管理员", "admin@blog.com", Role.ADMIN);
            User mod = saveUser("moderator", "mod123", "审核员", "mod@blog.com", Role.MODERATOR);
            User alice = saveUser("alice", "user123", "爱丽丝", "alice@blog.com", Role.USER);
            User bob = saveUser("bob", "user123", "鲍勃", "bob@blog.com", Role.USER);

            seedArticle("论如何优雅地摸鱼", "职场", "在工位上保持精神离职，是一种当代修行。", alice, 42);
            seedArticle("SpringBoot 拦截器最佳实践", "技术", "拦截器 vs 过滤器，一次讲清请求鉴权的正确姿势。", bob, 128);
            seedArticle("为什么我们需要草稿箱", "随笔", "灵感稍纵即逝，先存为草稿，再慢慢打磨。", alice, 17);
            seedArticle("热点榜是怎么算出来的", "技术", "按点赞量倒序，再按发布时间兜底，简单又直观。", mod, 73);

            // 线上博物馆：预置 5 件著名文物（管理员直接上线）
            if (relicRepository.count() == 0) {
                seedRelic(
                        "后母戊鼎",
                        "商代晚期",
                        "青铜",
                        "1939年 河南安阳武官村",
                        "中国国家博物馆",
                        "后母戊鼎（旧称司母戊鼎）是商代晚期的青铜礼器，1939年出土于河南安阳武官村，现藏中国国家博物馆。鼎呈长方形、四足，高133厘米、重832.84公斤，是迄今出土最重大的中国古代青铜器。腹内壁铸“后母戊”三字铭文，是商王祖庚为祭祀母亲“戊”而铸的祭器，器身满饰兽面纹与夔龙纹，双耳外侧各铸二虎噬人首，工艺繁复，是商代青铜铸造的巅峰之作。",
                        "svg/relics/houmuwu.svg",
                        admin);
                seedRelic(
                        "兵马俑",
                        "秦代",
                        "陶土",
                        "1974年 陕西临潼",
                        "秦始皇兵马俑博物馆",
                        "兵马俑是秦始皇陵的陪葬陶俑群，约公元前210—前209年烧制，1974年由陕西临潼农民打井时偶然发现，1987年列入世界文化遗产。俑以陶土分段塑成、写实逼真，与真人真马几近等大，军阵严整，涵盖步兵、骑兵、战车与弩兵，再现秦军雄姿，被誉为“世界第八大奇迹”。",
                        "svg/relics/terracotta.svg",
                        admin);
                seedRelic(
                        "越王勾践剑",
                        "春秋晚期",
                        "青铜",
                        "1965年 湖北江陵",
                        "湖北省博物馆",
                        "越王勾践剑是春秋晚期越国君主勾践自用的青铜剑，1965年出土于湖北江陵望山一号墓，现藏湖北省博物馆。剑长55.6厘米、重875克，剑身满饰黑色菱形暗格花纹，近格处刻鸟篆铭文“越王鸠浅自作用剑”。此剑深埋两千余年仍寒光逼人、几无锈蚀，锋利如新，采用双金属复合铸造使脊韧刃利，是先秦青铜剑工艺的典范。",
                        "svg/relics/goujian.svg",
                        admin);
                seedRelic(
                        "清明上河图",
                        "北宋",
                        "绢本设色",
                        "——",
                        "北京故宫博物院",
                        "《清明上河图》为北宋画家张择端所作的绢本水墨设色长卷，高25.5厘米、长5.25米，现藏北京故宫博物院。画卷自右向左徐徐展开，细致描绘清明时节北宋都城汴京（今河南开封）的城乡风貌与市井百态：虹桥舟船、城楼税铺、茶坊酒肆，八百余人物悉数入画，被誉为“中华第一神品”，是研究宋代社会的全景式图像史。",
                        "svg/relics/qingming.svg",
                        admin);
                seedRelic(
                        "曾侯乙编钟",
                        "战国早期",
                        "青铜",
                        "1978年 湖北随州",
                        "湖北省博物馆",
                        "曾侯乙编钟是战国早期（约公元前433年）的青铜乐器，1978年出土于湖北随州曾侯乙墓，现藏湖北省博物馆。全套编钟共65件，分三层八组悬于铜木钟架之上，总重逾2.5吨。其音域跨五个半八度，中心音域十二律齐备、可旋宫转调，一钟双音，铸造与乐律水平惊人，是先秦礼乐文明的巅峰实证，也是迄今最完整、最宏大的古代乐器。",
                        "svg/relics/zenghouyi.svg",
                        admin);
            }

            // 古董铺：预置若干闲置商品（不同卖家 / 分类 / 成色），方便一打开就能体验二手集市
            if (productRepository.count() == 0) {
                seedProduct(
                        "民国 铜胎掐丝珐琅鼻烟壶",
                        new BigDecimal("128.00"),
                        "杂项",
                        "八成新",
                        "民国时期铜胎掐丝珐琅鼻烟壶，釉色温润，口沿有细微使用痕，整体品相完好，适合案头把玩或入藏。",
                        admin);
                seedProduct(
                        "老上海 三针机械怀表",
                        new BigDecimal("360.00"),
                        "杂项",
                        "九五新",
                        "上世纪老上海产三针机械怀表，走时精准，表壳有自然包浆，附原装表链，机械控与复古爱好者可入。",
                        alice);
                seedProduct(
                        "汉 灰陶拓片一组",
                        new BigDecimal("88.00"),
                        "书画",
                        "有瑕疵",
                        "汉代灰陶纹饰拓片一组四张，拓工清晰，边角略有残损，不影响整体观赏，适合作书法纹样参考。",
                        bob);
                seedProduct(
                        "清 青花缠枝纹瓷片",
                        new BigDecimal("66.00"),
                        "瓷器",
                        "八成新",
                        "清代青花缠枝莲纹碗底残片，釉面干净、青花发色沉稳，断面可见胎质，适合标本收藏与教学。",
                        alice);
            }
        }
    }

    private User saveUser(String username, String pwd, String nickname, String email, Role role) {
        User u = new User();
        u.setUsername(username);
        String salt = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        u.setSalt(salt);
        u.setPassword(Md5Util.md5(pwd + salt));
        u.setNickname(nickname);
        u.setEmail(email);
        u.setRole(role);
        return userRepository.save(u);
    }

    private void seedArticle(String title, String category, String content, User author, int likes) {
        Article a = new Article();
        a.setTitle(title);
        a.setContent(content + "\n\n（这是种子示例内容，你可以在编辑页替换它。）");
        a.setSummary(content);
        a.setCategory(category);
        a.setStatus(ArticleStatus.PUBLISHED);
        a.setAuthorId(author.getId());
        a.setAuthorName(author.getNickname());
        a.setLikeCount(likes);
        a.setPublishedAt(LocalDateTime.now().minusDays(likes % 7L));
        articleRepository.save(a);
    }

    private void seedRelic(
            String title,
            String dynasty,
            String material,
            String origin,
            String location,
            String desc,
            String img,
            User author) {
        Relic r = new Relic();
        r.setTitle(title);
        r.setDynasty(dynasty);
        r.setMaterial(material);
        r.setOrigin(origin);
        r.setLocation(location);
        r.setDescription(desc);
        r.setStatus(RelicStatus.PUBLISHED);
        r.setAuthorId(author.getId());
        r.setAuthorName(author.getNickname());
        r.setPublishedAt(LocalDateTime.now().minusDays(title.length()));
        r.setReviewedBy(author.getNickname());
        r.setReviewedAt(LocalDateTime.now());
        relicRepository.save(r);
    }

    private void seedProduct(
            String title,
            BigDecimal price,
            String category,
            String itemCondition,
            String desc,
            User seller) {
        Product p = new Product();
        p.setTitle(title);
        p.setDescription(desc);
        p.setPrice(price);
        p.setCategory(category);
        p.setItemCondition(itemCondition);
        p.setSellerId(seller.getId());
        p.setSellerName(seller.getNickname());
        p.setStatus(ProductStatus.AVAILABLE);
        p.setCreatedAt(LocalDateTime.now().minusDays(title.length()));
        productRepository.save(p);
    }
}
