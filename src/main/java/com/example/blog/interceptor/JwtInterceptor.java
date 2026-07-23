package com.example.blog.interceptor;

import com.example.blog.util.JwtUtil;
import com.example.blog.util.TokenBlacklist;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
  * JWT 拦截器：在 Controller 之前校验令牌。
  *
  * <p>公开（无需登录）的接口： - /api/auth/* 登录/注册/注销 - GET /api/articles* 文章列表与详情（只读） - GET /api/hot* 热点榜（只读） -
  * GET /api/relics* 线上博物馆文物列表与详情（只读） - GET /api/letters* 读者来信列表与详情（只读） - GET /api/puzzles*
  * 每日谜题词方与榜单（只读） - GET /api/shop/products* 古董铺在售商品列表与详情（只读） 其余 /api/** 必须在请求头携带 Authorization:
  * Bearer <token>
  */
@Component
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final TokenBlacklist blacklist;

    public JwtInterceptor(JwtUtil jwtUtil, TokenBlacklist blacklist) {
        this.jwtUtil = jwtUtil;
        this.blacklist = blacklist;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // 公开接口：auth 相关直接放行
        if (path.startsWith("/api/auth/")) return true;

        // AI 助手内部查询接口（仅本机 Python 服务调用，无需 token）
        if (path.startsWith("/api/ai/query")) return true;

        // GET /api/articles、GET /api/hot、GET /api/relics 为「半公开」：
        //   无 token 可正常访问（公开浏览）；有 token 则解析并注入用户信息（用于个性化功能）
        boolean isPublicRead =
                "GET".equals(method)
                        && (path.startsWith("/api/articles")
                                || path.startsWith("/api/hot")
                                || path.startsWith("/api/relics")
                                || path.startsWith("/api/letters")
                                || path.startsWith("/api/puzzles")
                                || path.startsWith("/api/shop/products"));
        String header = request.getHeader("Authorization");
        boolean hasToken = header != null && header.startsWith("Bearer ");

        if (isPublicRead) {
            if (hasToken) {
                // 有 token 则尝试解析，成功则注入用户信息；解析失败不阻塞（降级为匿名访问）
                String token = header.substring(7);
                try {
                    Claims claims = jwtUtil.parseToken(token);
                    String jti = claims.getId();
                    if (jti != null && blacklist.contains(jti)) return true; // token 已注销，按匿名处理
                    request.setAttribute("userId", Long.valueOf(claims.getSubject()));
                    request.setAttribute("username", claims.get("username", String.class));
                    request.setAttribute("role", claims.get("role", String.class));
                    request.setAttribute("jti", jti);
                } catch (Exception e) {
                    /* token 无效，忽略，以匿名身份继续 */
                }
            }
            return true; // 无论是否有 token 都放行
        }

        // 其余 /api/** 接口要求合法令牌
        if (!hasToken) {
            writeUnauthorized(response, "未登录或 token 缺失");
            return false;
        }

        String token = header.substring(7);
        try {
            Claims claims = jwtUtil.parseToken(token);
            String jti = claims.getId();
            if (jti != null && blacklist.contains(jti)) {
                writeUnauthorized(response, "登录已失效，请重新登录");
                return false;
            }
            // 把解析出的用户信息放进 request，供 Controller 通过 @RequestAttribute 读取
            request.setAttribute("userId", Long.valueOf(claims.getSubject()));
            request.setAttribute("username", claims.get("username", String.class));
            request.setAttribute("role", claims.get("role", String.class));
            request.setAttribute("jti", jti);
            return true;
        } catch (Exception e) {
            writeUnauthorized(response, "token 无效或已过期");
            return false;
        }
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":401,\"message\":\"" + message + "\"}");
    }
}
