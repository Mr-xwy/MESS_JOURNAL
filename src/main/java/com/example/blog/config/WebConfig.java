package com.example.blog.config;

import com.example.blog.interceptor.JwtInterceptor;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Web 配置：注册 JWT 拦截器 + 跨域（CORS）配置。 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;

    /** 允许跨域的来源白名单；携带凭证时不能用 "*"，必须显式列出。 */
    @Value(
            "#{'${app.cors.allowed-origins:http://localhost:8080,http://127.0.0.1:8080,null}'.split(',')}")
    private List<String> allowedOrigins;

    public WebConfig(JwtInterceptor jwtInterceptor) {
        this.jwtInterceptor = jwtInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 只对 /api/** 做鉴权；静态页面不走这里
        registry.addInterceptor(jwtInterceptor).addPathPatterns("/api/**");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 仅允许白名单来源跨域；allowCredentials(true) 与显式来源组合是安全的（不再用 "*"）。
        // null 用于本地以 file:// 直接打开前端调试；生产部署请去掉并只留真实前端域名。
        registry
                .addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
