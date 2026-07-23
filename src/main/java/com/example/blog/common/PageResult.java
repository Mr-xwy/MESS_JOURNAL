package com.example.blog.common;

import java.util.List;
import lombok.Data;
import org.springframework.data.domain.Page;

/** 分页结果包装，便于前端直接拿到列表与分页元信息。 */
@Data
public class PageResult<T> {

    private List<T> list;
    private long total;
    private int page;
    private int size;
    private int totalPages;

    public static <T> PageResult<T> of(Page<T> pageData) {
        PageResult<T> r = new PageResult<>();
        r.list = pageData.getContent();
        r.total = pageData.getTotalElements();
        r.page = pageData.getNumber();
        r.size = pageData.getSize();
        r.totalPages = pageData.getTotalPages();
        return r;
    }
}
