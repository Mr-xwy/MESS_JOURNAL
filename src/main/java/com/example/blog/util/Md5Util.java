package com.example.blog.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
  * MD5 工具。 注意：本示例为贴合你的需求使用 MD5，但生产环境 MD5 已不安全， 建议改用 BCrypt（Spring Security 的 PasswordEncoder）。这里用“密码
  * + 随机盐”降低彩虹表风险。
  */
public class Md5Util {

    public static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 algorithm not found", e);
        }
    }
}
