#!/usr/bin/env python3
"""
Training endpoints for IntelliLab GC API
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from app.models.schemas import (
    TrainingLesson, TrainingExercise, TrainingAttempt, ExerciseResult,
    CreateLesson, CreateExercise, AttemptSubmission, CourseProgress,
    TrainingSearchFilter, TrainingDifficulty, TrainingExerciseType
)
from app.services.training_service import training_service

router = APIRouter()


@router.get("/lessons", response_model=List[TrainingLesson])
async def list_lessons(
    published_only: bool = Query(True, description="Only return published lessons"),
    difficulty: Optional[TrainingDifficulty] = Query(None, description="Filter by difficulty"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags")
):
    """List training lessons"""
    lessons = training_service.list_lessons(published_only=published_only)
    
    # Apply filters
    if difficulty:
        lessons = [l for l in lessons if hasattr(l, 'difficulty') and l.difficulty == difficulty]
    
    if tags:
        lessons = [l for l in lessons if any(tag in l.tags for tag in tags)]
    
    return lessons


@router.post("/lessons", response_model=TrainingLesson)
async def create_lesson(
    lesson_data: CreateLesson,
    author: str = "System"  # In production, get from auth context
):
    """Create a new training lesson"""
    try:
        lesson = training_service.create_lesson(lesson_data, author)
        return lesson
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/lessons/{lesson_id}", response_model=TrainingLesson)
async def get_lesson(lesson_id: int):
    """Get a specific training lesson"""
    lesson = training_service.lessons.get(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return lesson


@router.put("/lessons/{lesson_id}", response_model=TrainingLesson)
async def update_lesson(
    lesson_id: int,
    lesson_data: CreateLesson
):
    """Update a training lesson"""
    lesson = training_service.update_lesson(lesson_id, lesson_data.dict())
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return lesson


@router.post("/lessons/{lesson_id}/publish")
async def publish_lesson(lesson_id: int):
    """Publish a training lesson"""
    success = training_service.publish_lesson(lesson_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return {"status": "published", "lesson_id": lesson_id}


@router.get("/lessons/{lesson_id}/exercises", response_model=List[TrainingExercise])
async def list_exercises(lesson_id: int):
    """List exercises for a specific lesson"""
    exercises = training_service.list_exercises(lesson_id)
    return exercises


@router.post("/exercises", response_model=TrainingExercise)
async def create_exercise(exercise_data: CreateExercise):
    """Create a new training exercise"""
    try:
        exercise = training_service.create_exercise(exercise_data)
        return exercise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/exercises/{exercise_id}", response_model=TrainingExercise)
async def get_exercise(exercise_id: int):
    """Get a specific training exercise"""
    exercise = training_service.exercises.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    return exercise


@router.put("/exercises/{exercise_id}", response_model=TrainingExercise)
async def update_exercise(
    exercise_id: int,
    exercise_data: CreateExercise
):
    """Update a training exercise"""
    exercise = training_service.update_exercise(exercise_id, exercise_data.dict())
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    return exercise


@router.post("/attempts/start")
async def start_attempt(
    exercise_id: int,
    user_id: int = 1  # In production, get from auth context
):
    """Start a new exercise attempt"""
    try:
        attempt_id, initial_state = training_service.start_attempt(exercise_id, user_id)
        return {
            "attempt_id": attempt_id,
            "initial_state": initial_state
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/attempts/submit", response_model=ExerciseResult)
async def submit_attempt(submission: AttemptSubmission):
    """Submit an exercise attempt for scoring"""
    try:
        result = training_service.score_attempt(submission)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/attempts/{attempt_id}", response_model=TrainingAttempt)
async def get_attempt(attempt_id: int):
    """Get a specific attempt"""
    attempt = training_service.get_attempt(attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    return attempt


@router.get("/courses/{course_id}/progress")
async def get_course_progress(
    course_id: int,
    user_id: int = Query(1, description="User ID")  # In production, get from auth context
):
    """Get course progress for a user"""
    progress = training_service.course_progress(user_id, course_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")
    
    return progress


@router.get("/search", response_model=List[TrainingLesson])
async def search_lessons(
    query: Optional[str] = Query(None, description="Search query"),
    difficulty: Optional[TrainingDifficulty] = Query(None, description="Filter by difficulty"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    author: Optional[str] = Query(None, description="Filter by author"),
    published_only: bool = Query(True, description="Only return published lessons"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results")
):
    """Search training lessons"""
    lessons = training_service.list_lessons(published_only=published_only)
    
    # Apply filters
    if difficulty:
        lessons = [l for l in lessons if hasattr(l, 'difficulty') and l.difficulty == difficulty]
    
    if tags:
        lessons = [l for l in lessons if any(tag in l.tags for tag in tags)]
    
    if author:
        lessons = [l for l in lessons if l.author.lower() == author.lower()]
    
    if query:
        query_lower = query.lower()
        lessons = [l for l in lessons 
                  if query_lower in l.title.lower() 
                  or query_lower in (l.description or "").lower()
                  or any(query_lower in tag.lower() for tag in l.tags)]
    
    # Apply limit
    lessons = lessons[:limit]
    
    return lessons


@router.get("/exercises/types", response_model=List[str])
async def get_exercise_types():
    """Get available exercise types"""
    return [e.value for e in TrainingExerciseType]


@router.get("/difficulties", response_model=List[str])
async def get_difficulties():
    """Get available difficulty levels"""
    return [d.value for d in TrainingDifficulty]


@router.get("/stats")
async def get_training_stats(user_id: int = 1):  # In production, get from auth context
    """Get training statistics for a user"""
    # Calculate user stats
    user_attempts = [a for a in training_service.attempts.values() if a.user_id == user_id]
    
    total_attempts = len(user_attempts)
    passed_attempts = len([a for a in user_attempts if a.passed])
    avg_score = 0.0
    
    if user_attempts:
        scores = [a.score for a in user_attempts if a.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0.0
    
    # Time spent
    total_time_minutes = sum(a.time_taken_sec or 0 for a in user_attempts) / 60
    
    # Lessons completed (simplified - would need actual completion tracking)
    completed_lessons = len(set(a.exercise_id for a in user_attempts if a.passed))
    
    return {
        "total_attempts": total_attempts,
        "passed_attempts": passed_attempts,
        "pass_rate": (passed_attempts / total_attempts * 100) if total_attempts > 0 else 0.0,
        "avg_score": avg_score,
        "total_time_minutes": total_time_minutes,
        "completed_lessons": completed_lessons,
        "user_id": user_id
    }


@router.get("/exercises/{exercise_id}/hints")
async def get_exercise_hints(exercise_id: int):
    """Get hints for an exercise"""
    exercise = training_service.exercises.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    return {
        "exercise_id": exercise_id,
        "hints": exercise.hints
    }


@router.get("/exercises/{exercise_id}/scoring-rubric")
async def get_exercise_rubric(exercise_id: int):
    """Get scoring rubric for an exercise (for instructors)"""
    exercise = training_service.exercises.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    return {
        "exercise_id": exercise_id,
        "scoring_rubric": exercise.scoring_rubric,
        "expected_outcome": exercise.expected_outcome
    }
