package com.example.blog.service;

import com.example.blog.common.BusinessException;
import com.example.blog.common.Role;
import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.RegisterRequest;
import com.example.blog.dto.UpdateUserRequest;
import com.example.blog.entity.FileOwnerType;
import com.example.blog.entity.User;
import com.example.blog.repository.UserRepository;
import com.example.blog.service.FileAssetService;
import com.example.blog.util.JwtUtil;
import com.example.blog.util.Md5Util;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final FileAssetService fileAssetService;

    @Transactional
    public User register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new BusinessException("用户名已存在");
        }
        User user = new User();
        user.setUsername(req.getUsername());
        String salt = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        user.setSalt(salt);
        user.setPassword(Md5Util.md5(req.getPassword() + salt));
        user.setNickname(req.getNickname() != null ? req.getNickname() : req.getUsername());
        user.setEmail(req.getEmail());
        user.setRole(Role.USER); // 注册默认普通用户
        return userRepository.save(user);
    }

    public Map<String, Object> login(LoginRequest req) {
        User user =
                userRepository
                        .findByUsername(req.getUsername())
                        .orElseThrow(() -> new BusinessException("用户不存在"));
        String inputEnc = Md5Util.md5(req.getPassword() + user.getSalt());
        if (!inputEnc.equals(user.getPassword())) {
            throw new BusinessException("密码错误");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", toVo(user));
        return result;
    }

    @Transactional
    public User updateInfo(Long userId, UpdateUserRequest req) {
        User user = userRepository.findById(userId).orElseThrow(() -> new BusinessException("用户不存在"));
        if (req.getNickname() != null) user.setNickname(req.getNickname());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getAvatar() != null) {
            // 头像不再内嵌 t_user，改存 t_file（owner_type=AVATAR）；前端 base64 上限放宽到 5MB
            if (req.getAvatar().length() > 5_000_000) {
                throw new BusinessException("头像图片过大，请压缩后再上传（建议小于 3MB）");
            }
            fileAssetService.upsert(FileOwnerType.AVATAR, userId, req.getAvatar());
        }

        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getOldPassword() == null
                    || !Md5Util.md5(req.getOldPassword() + user.getSalt()).equals(user.getPassword())) {
                throw new BusinessException("原密码错误");
            }
            user.setPassword(Md5Util.md5(req.getNewPassword() + user.getSalt()));
        }
        return userRepository.save(user);
    }

    /** 删除用户：本人可注销，管理员可删除任意用户（注意：关联的文章/订单等为 Long 外键，物理删除会产生孤儿数据，生产建议软删） */
    @Transactional
    public void deleteUser(Long targetId, Long operatorId, String role) {
        if (operatorId == null) throw new BusinessException(401, "请先登录");
        if (!Role.ADMIN.name().equals(role) && !operatorId.equals(targetId)) {
            throw new BusinessException(403, "无权删除该用户");
        }
        User user = userRepository.findById(targetId).orElseThrow(() -> new BusinessException("用户不存在"));
        userRepository.delete(user);
    }

    public User info(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new BusinessException("用户不存在"));
    }

    /** 对外暴露的用户视图（不含密码/盐等敏感字段）；头像从 t_file 装配 */
    public Map<String, Object> toVo(User u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("nickname", u.getNickname());
        m.put("email", u.getEmail());
        m.put("avatar", fileAssetService.load(FileOwnerType.AVATAR, u.getId()));
        m.put("role", u.getRole().name());
        m.put("createdAt", u.getCreatedAt());
        return m;
    }
}
