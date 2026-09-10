package com.redsena.demo.feed.presentation;

import java.io.Serializable;

public record PageInfo(boolean hasNextPage, String endCursor) implements Serializable {
}
