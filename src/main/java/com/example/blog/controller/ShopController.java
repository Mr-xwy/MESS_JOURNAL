package com.example.blog.controller;

import com.example.blog.common.PageResult;
import com.example.blog.common.Result;
import com.example.blog.dto.OrderRequest;
import com.example.blog.dto.OrderUpdateRequest;
import com.example.blog.dto.ProductRequest;
import com.example.blog.entity.OrderStatus;
import com.example.blog.service.ShopService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    /** 公开列表（在售商品，分页 + 分类 / 关键词筛选） */
    @GetMapping("/products")
    public Result<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        Page<?> p = shopService.listAvailable(page, size, category, keyword);
        return Result.success(PageResult.of(p));
    }

    /** 商品详情（公开） */
    @GetMapping("/products/{id}")
    public Result<?> detail(@PathVariable Long id) {
        return Result.success(shopService.detail(id));
    }

    /** 发布闲置（需登录） */
    @PostMapping("/products")
    public Result<?> create(@Valid @RequestBody ProductRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String username = (String) request.getAttribute("username");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(shopService.create(req, userId, username));
    }

    /** 我的发布（需登录） */
    @GetMapping("/products/mine")
    public Result<?> mine(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(shopService.myListings(userId));
    }

    /** 下架 / 删除（作者本人或管理员） */
    @DeleteMapping("/products/{id}")
    public Result<?> delete(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        shopService.delete(id, userId, role);
        return Result.success("已下架");
    }

    /** 编辑闲置（作者本人或管理员） */
    @PutMapping("/products/{id}")
    public Result<?> updateProduct(
            @PathVariable Long id, @Valid @RequestBody ProductRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        return Result.success(shopService.updateProduct(id, req, userId, role));
    }

    /** 更新订单状态（买家取消 / 卖家标记付款；管理员均可） */
    @PutMapping("/orders/{id}")
    public Result<?> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderUpdateRequest req,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        OrderStatus status = OrderStatus.valueOf(req.getStatus());
        return Result.success(shopService.updateOrderStatus(id, status, userId, role));
    }

    /** 删除订单（买家 / 卖家 / 管理员） */
    @DeleteMapping("/orders/{id}")
    public Result<?> deleteOrder(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        shopService.deleteOrder(id, userId, role);
        return Result.success("删除成功");
    }

    /** 下单（需登录）：返回创建的订单 */
    @PostMapping("/orders")
    public Result<?> createOrder(@Valid @RequestBody OrderRequest req, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String username = (String) request.getAttribute("username");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(shopService.createOrder(req, userId, username));
    }

    /** 我买的（需登录） */
    @GetMapping("/orders/mine")
    public Result<?> myOrders(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(shopService.myBought(userId));
    }

    /** 我卖的（需登录） */
    @GetMapping("/orders/sold")
    public Result<?> soldOrders(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(shopService.mySold(userId));
    }

    /** 订单详情（买家 / 卖家 / 管理员可见） */
    @GetMapping("/orders/{id}")
    public Result<?> orderDetail(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        return Result.success(shopService.orderDetail(id, userId, role));
    }
}
