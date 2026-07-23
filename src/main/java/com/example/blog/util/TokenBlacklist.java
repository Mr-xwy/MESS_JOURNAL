package com.example.blog.util;

import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
  * 简单的 JWT 注销黑名单（内存实现）。 说明：JWT 本身是无状态的，正常“注销”前端丢弃 token 即可。 这里在服务端维护一个 jti 黑名单，让注销后的 token
  * 立即失效，演示更完整的安全模型。 生产环境可换成 Redis 存储。
  */
@Component
public class TokenBlacklist {

    private final ConcurrentHashMap<String, Boolean> set = new ConcurrentHashMap<>();

    public void add(String jti) {
        if (jti != null) set.put(jti, Boolean.TRUE);
    }

    public boolean contains(String jti) {
        return jti != null && set.containsKey(jti);
    }
}
