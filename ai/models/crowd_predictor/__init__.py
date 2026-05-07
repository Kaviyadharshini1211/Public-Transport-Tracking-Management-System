"""
Crowd Predictor Model Package
=============================
Predicts the crowd density level on local buses based on time, route, stop,
day-of-week and weather conditions.

Exposes:
    CrowdPredictor  — loads trained GradientBoosting models and returns
                      a crowd_level label + estimated passenger count.
"""
from .predictor import CrowdPredictor

__all__ = ["CrowdPredictor"]
