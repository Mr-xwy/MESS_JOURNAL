package com.example.blog.dto;

/** AI 助手提问请求体。 */
public class AiChatRequest {

    /** 用户提出的问题 */
    private String question;

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }
}
