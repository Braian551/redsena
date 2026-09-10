package com.redsena.demo.likes.presentation;

import java.io.Serializable;

public record PostLikeResult(boolean liked, long likeCount) implements Serializable {
}
