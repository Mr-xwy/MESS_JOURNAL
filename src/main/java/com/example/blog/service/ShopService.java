package com.example.blog.service;

import com.example.blog.common.BusinessException;
import com.example.blog.common.Role;
import com.example.blog.dto.OrderRequest;
import com.example.blog.dto.ProductRequest;
import com.example.blog.entity.*;
import com.example.blog.repository.OrderRepository;
import com.example.blog.repository.OrderSnapshotRepository;
import com.example.blog.repository.ProductRepository;
import com.example.blog.repository.UserRepository;
import com.example.blog.service.FileAssetService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final FileAssetService fileAssetService;
    private final OrderSnapshotRepository orderSnapshotRepository;

    /** 公开列表：仅展示在售商品，支持分类与关键词筛选，分页（最新在前） */
    public Page<Product> listAvailable(int page, int size, String category, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (keyword != null && !keyword.isBlank()) {
            return productRepository.findByStatusAndTitleContaining(
                    ProductStatus.AVAILABLE, keyword.trim(), pageable);
        }
        if (category != null && !category.isBlank()) {
            return productRepository.findByStatusAndCategory(
                    ProductStatus.AVAILABLE, category.trim(), pageable);
        }
        Page<Product> p = productRepository.findByStatus(ProductStatus.AVAILABLE, pageable);
        attachProductImages(p.getContent());
        return p;
    }

    /** 商品详情（公开） */
    public Product detail(Long id) {
        Product p = productRepository.findById(id).orElseThrow(() -> new BusinessException("商品不存在"));
        attachProductImage(p);
        return p;
    }

    /** 发布闲置（需登录） */
    @Transactional
    public Product create(ProductRequest req, Long userId, String username) {
        userRepository.findById(userId).orElseThrow(() -> new BusinessException("用户不存在"));
        if (req.getImage() != null && req.getImage().length() > 5_000_000) {
            throw new BusinessException("图片过大，请压缩后再上传（建议 < 3.5MB）");
        }
        Product p = new Product();
        p.setTitle(req.getTitle());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setCategory(req.getCategory());
        p.setItemCondition(req.getItemCondition());
        p.setSellerId(userId);
        p.setSellerName(username);
        p.setStatus(ProductStatus.AVAILABLE);
        Product saved = productRepository.save(p);
        fileAssetService.upsert(FileOwnerType.PRODUCT_IMAGE, saved.getId(), req.getImage());
        saved.setImage(req.getImage());
        return saved;
    }

    /** 我的发布（含已售/已下架；需登录） */
    public List<Product> myListings(Long userId) {
        List<Product> list = productRepository.findBySellerId(userId);
        attachProductImages(list);
        return list;
    }

    /** 下架 / 删除：作者本人或管理员；存在待付款订单时拦截 */
    @Transactional
    public void delete(Long id, Long userId, String role) {
        Product p = productRepository.findById(id).orElseThrow(() -> new BusinessException("商品不存在"));
        if (!Role.ADMIN.name().equals(role) && (userId == null || !userId.equals(p.getSellerId()))) {
            throw new BusinessException(403, "无权下架该商品");
        }
        if (orderRepository.existsByProductIdAndStatus(id, OrderStatus.PENDING)) {
            throw new BusinessException("该商品存在待付款订单，暂时无法下架");
        }
        productRepository.delete(p);
    }

    /** 编辑闲置（作者本人或管理员）：替换可编辑字段，保留状态 */
    @Transactional
    public Product updateProduct(Long id, ProductRequest req, Long userId, String role) {
        Product p = productRepository.findById(id).orElseThrow(() -> new BusinessException("商品不存在"));
        if (!Role.ADMIN.name().equals(role) && (userId == null || !userId.equals(p.getSellerId()))) {
            throw new BusinessException(403, "无权编辑该商品");
        }
        p.setTitle(req.getTitle());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setCategory(req.getCategory());
        p.setItemCondition(req.getItemCondition());
        if (req.getImage() != null) {
            if (req.getImage().length() > 5_000_000) {
                throw new BusinessException("图片过大，请压缩后再上传（建议 < 3.5MB）");
            }
            fileAssetService.upsert(FileOwnerType.PRODUCT_IMAGE, id, req.getImage());
        }
        Product saved = productRepository.save(p);
        saved.setImage(fileAssetService.load(FileOwnerType.PRODUCT_IMAGE, id));
        return saved;
    }

    /** 更新订单状态（买家可取消、卖家可标记付款；管理员均可） */
    @Transactional
    public Order updateOrderStatus(Long id, OrderStatus newStatus, Long userId, String role) {
        Order o = orderRepository.findById(id).orElseThrow(() -> new BusinessException("订单不存在"));
        boolean owner =
                userId != null && (userId.equals(o.getBuyerId()) || userId.equals(o.getSellerId()));
        if (!owner && !Role.ADMIN.name().equals(role)) {
            throw new BusinessException(403, "无权操作该订单");
        }
        if (newStatus == OrderStatus.CANCELLED) {
            if (o.getStatus() != OrderStatus.PENDING) throw new BusinessException("仅待付款订单可取消");
        } else if (newStatus == OrderStatus.PAID) {
            if (o.getStatus() != OrderStatus.PENDING) throw new BusinessException("仅待付款订单可标记付款");
            o.setPaidAt(LocalDateTime.now());
        } else {
            throw new BusinessException("不支持的订单状态");
        }
        o.setStatus(newStatus);
        Order saved = orderRepository.save(o);
        attachSnapshot(saved);
        return saved;
    }

    /** 删除订单（买家 / 卖家 / 管理员）；已付款订单不允许物理删除 */
    @Transactional
    public void deleteOrder(Long id, Long userId, String role) {
        Order o = orderRepository.findById(id).orElseThrow(() -> new BusinessException("订单不存在"));
        boolean owner =
                userId != null && (userId.equals(o.getBuyerId()) || userId.equals(o.getSellerId()));
        if (!owner && !Role.ADMIN.name().equals(role)) {
            throw new BusinessException(403, "无权删除该订单");
        }
        if (o.getStatus() == OrderStatus.PAID) {
            throw new BusinessException("已付款订单不可删除");
        }
        orderRepository.delete(o);
    }

    /** 下单：快照商品信息，标记售出（锁定库存），禁止购买自己的商品 */
    @Transactional
    public Order createOrder(OrderRequest req, Long buyerId, String buyerName) {
        Product p =
                productRepository
                        .findById(req.getProductId())
                        .orElseThrow(() -> new BusinessException("商品不存在"));
        if (p.getStatus() != ProductStatus.AVAILABLE) {
            throw new BusinessException("该商品已售出或已下架");
        }
        if (buyerId.equals(p.getSellerId())) {
            throw new BusinessException("不能购买自己发布的商品");
        }
        Order o =
                Order.builder()
                        .orderNo(genOrderNo())
                        .productId(p.getId())
                        .price(p.getPrice())
                        .buyerId(buyerId)
                        .buyerName(buyerName)
                        .sellerId(p.getSellerId())
                        .sellerName(p.getSellerName())
                        .contactName(req.getContactName())
                        .contactPhone(req.getContactPhone())
                        .contactAddress(req.getContactAddress())
                        .note(req.getNote())
                        .status(OrderStatus.PENDING)
                        .build();
        // 锁定库存：下单即标记售出，防止超卖（付款流程上线后可改为 PAID 后才标记）
        p.setStatus(ProductStatus.SOLD);
        productRepository.save(p);
        Order saved = orderRepository.save(o);
        // 冻结下单时点的商品/用户展示数据到 t_order_snapshot（历史订单不再回查商品表）
        String productImage = fileAssetService.load(FileOwnerType.PRODUCT_IMAGE, p.getId());
        orderSnapshotRepository.save(OrderSnapshot.builder()
                .orderId(saved.getId())
                .productTitle(p.getTitle())
                .productImage(productImage)
                .price(p.getPrice())
                .sellerName(p.getSellerName())
                .buyerName(buyerName)
                .build());
        saved.setProductTitle(p.getTitle());
        saved.setProductImage(productImage);
        saved.setPrice(p.getPrice());
        saved.setSellerName(p.getSellerName());
        saved.setBuyerName(buyerName);
        return saved;
    }

    /** 我买的（作为买家） */
    public List<Order> myBought(Long userId) {
        List<Order> list = orderRepository.findByBuyerIdOrderByCreatedAtDesc(userId);
        attachSnapshots(list);
        return list;
    }

    /** 我卖的（作为卖家） */
    public List<Order> mySold(Long userId) {
        List<Order> list = orderRepository.findBySellerIdOrderByCreatedAtDesc(userId);
        attachSnapshots(list);
        return list;
    }

    /** 订单详情：买家 / 卖家 / 管理员可见 */
    public Order orderDetail(Long id, Long userId, String role) {
        Order o = orderRepository.findById(id).orElseThrow(() -> new BusinessException("订单不存在"));
        boolean owner =
                userId != null && (userId.equals(o.getBuyerId()) || userId.equals(o.getSellerId()));
        if (!owner && !Role.ADMIN.name().equals(role)) {
            throw new BusinessException(403, "无权查看该订单");
        }
        attachSnapshot(o);
        return o;
    }

    private void attachProductImage(Product p) {
        p.setImage(fileAssetService.load(FileOwnerType.PRODUCT_IMAGE, p.getId()));
    }

    private void attachProductImages(List<Product> list) {
        if (list == null) return;
        list.forEach(this::attachProductImage);
    }

    private void attachSnapshot(Order o) {
        orderSnapshotRepository.findByOrderId(o.getId()).ifPresent(s -> {
            o.setProductTitle(s.getProductTitle());
            o.setProductImage(s.getProductImage());
            o.setPrice(s.getPrice());
            o.setSellerName(s.getSellerName());
            o.setBuyerName(s.getBuyerName());
        });
    }

    private void attachSnapshots(List<Order> list) {
        if (list == null) return;
        list.forEach(this::attachSnapshot);
    }

    private String genOrderNo() {
        return "MESS"
                + LocalDateTime.now().toLocalDate().toString().replace("-", "")
                + System.currentTimeMillis() % 1000000
                + (int) (Math.random() * 9000 + 1000);
    }
}
