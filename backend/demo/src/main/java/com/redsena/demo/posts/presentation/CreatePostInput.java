package com.redsena.demo.posts.presentation;

import java.util.List;

public record CreatePostInput(String content, List<String> mediaIds) {
}
