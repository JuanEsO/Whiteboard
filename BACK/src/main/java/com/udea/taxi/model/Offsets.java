package com.udea.taxi.model;

public record Offsets(ActionType actionType, Offset offset, String color) {
    public record Offset(double x, double y) {
    }
}
