#!/usr/bin/env python3
"""
Training service for IntelliLab GC
Handles lessons, exercises, attempts, and progress tracking
"""

import json
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from app.models.schemas import (
    TrainingLesson, TrainingExercise, TrainingAttempt, TrainingCourse,
    Enrollment, ProgressSummary, CreateLesson, CreateExercise, 
    AttemptSubmission, ExerciseResult, CourseProgress,
    TrainingExerciseType, TrainingDifficulty, EnrollmentStatus
)


class TrainingService:
    """Training service for managing lessons, exercises, and progress"""
    
    def __init__(self):
        # In-memory storage for demo (replace with database in production)
        self.lessons: Dict[int, TrainingLesson] = {}
        self.exercises: Dict[int, TrainingExercise] = {}
        self.attempts: Dict[int, TrainingAttempt] = {}
        self.courses: Dict[int, TrainingCourse] = {}
        self.enrollments: Dict[int, Enrollment] = {}
        self.progress: Dict[str, ProgressSummary] = {}
        
        # Initialize with sample data
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """Initialize with sample training content"""
        # Sample lessons
        lesson1 = TrainingLesson(
            id=1,
            title="GC Method Development Fundamentals",
            slug="gc-method-development",
            description="Learn the basics of GC method development including column selection, temperature programming, and detector optimization.",
            version="1.0.0",
            tags=["method-development", "fundamentals", "gc"],
            est_minutes=45,
            author="Dr. Sarah Johnson",
            content={
                "sections": [
                    {
                        "title": "Introduction to GC",
                        "content": "Gas chromatography is a powerful analytical technique...",
                        "type": "text"
                    },
                    {
                        "title": "Column Selection",
                        "content": "The choice of column is critical for successful separation...",
                        "type": "text"
                    }
                ]
            },
            published=True,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        lesson2 = TrainingLesson(
            id=2,
            title="Troubleshooting Common GC Issues",
            slug="gc-troubleshooting",
            description="Identify and resolve common problems in gas chromatography including peak tailing, baseline drift, and retention time shifts.",
            version="1.0.0",
            tags=["troubleshooting", "maintenance", "gc"],
            est_minutes=60,
            author="Dr. Michael Chen",
            content={
                "sections": [
                    {
                        "title": "Peak Shape Problems",
                        "content": "Poor peak shape can indicate various issues...",
                        "type": "text"
                    }
                ]
            },
            published=True,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.lessons[1] = lesson1
        self.lessons[2] = lesson2
        
        # Sample exercises
        exercise1 = TrainingExercise(
            id=1,
            lesson_id=1,
            type=TrainingExerciseType.METHOD_SETUP,
            difficulty=TrainingDifficulty.INTERMEDIATE,
            prompt="Configure a GC method for analyzing BTEX compounds (benzene, toluene, ethylbenzene, xylene) with the following requirements: Initial temperature 40°C, final temperature 200°C, ramp rate 10°C/min, split ratio 10:1, carrier gas flow 1.0 mL/min.",
            initial_state={
                "oven": {"initial_temp": 40, "final_temp": 200, "ramp_rate": 10},
                "inlet": {"split_ratio": 10, "temperature": 250},
                "detector": {"temperature": 250, "flow": 1.0}
            },
            expected_outcome={
                "oven": {"initial_temp": 40, "final_temp": 200, "ramp_rate": 10},
                "inlet": {"split_ratio": 10, "temperature": 250},
                "detector": {"temperature": 250, "flow": 1.0}
            },
            scoring_rubric={
                "tolerance": {
                    "temperature": 5.0,
                    "ramp_rate": 2.0,
                    "split_ratio": 2.0,
                    "flow": 0.2
                },
                "weights": {
                    "oven": 0.4,
                    "inlet": 0.3,
                    "detector": 0.3
                }
            },
            time_limit_sec=600,
            hints=["Consider the volatility of BTEX compounds", "Split ratio affects peak height"],
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        exercise2 = TrainingExercise(
            id=2,
            lesson_id=2,
            type=TrainingExerciseType.FAULT_DIAGNOSIS,
            difficulty=TrainingDifficulty.ADVANCED,
            prompt="A chromatogram shows tailing peaks and baseline drift. Identify the most likely causes and suggest solutions.",
            initial_state={
                "symptoms": ["tailing_peaks", "baseline_drift"],
                "instrument_age": 5,
                "last_maintenance": "3_months_ago"
            },
            expected_outcome={
                "causes": ["contaminated_inlet", "dirty_column", "degraded_septum"],
                "solutions": ["replace_septum", "clean_inlet", "condition_column"]
            },
            scoring_rubric={
                "causes": {
                    "contaminated_inlet": 0.3,
                    "dirty_column": 0.4,
                    "degraded_septum": 0.3
                },
                "solutions": {
                    "replace_septum": 0.3,
                    "clean_inlet": 0.4,
                    "condition_column": 0.3
                }
            },
            time_limit_sec=900,
            hints=["Check when the septum was last replaced", "Consider column conditioning"],
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.exercises[1] = exercise1
        self.exercises[2] = exercise2
        
        # Sample course
        course1 = TrainingCourse(
            id=1,
            title="GC Fundamentals & Troubleshooting",
            description="Comprehensive course covering GC method development and troubleshooting techniques.",
            lessons_ordered_ids=[1, 2],
            published=True,
            author="IntelliLab Training Team",
            est_total_hours=1.75,
            difficulty=TrainingDifficulty.INTERMEDIATE,
            tags=["gc", "fundamentals", "troubleshooting"],
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.courses[1] = course1
    
    def create_lesson(self, lesson_data: CreateLesson, author: str) -> TrainingLesson:
        """Create a new training lesson"""
        lesson_id = max(self.lessons.keys(), default=0) + 1
        
        lesson = TrainingLesson(
            id=lesson_id,
            title=lesson_data.title,
            slug=lesson_data.slug,
            description=lesson_data.description,
            tags=lesson_data.tags,
            est_minutes=lesson_data.est_minutes,
            author=author,
            content=lesson_data.content,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.lessons[lesson_id] = lesson
        return lesson
    
    def update_lesson(self, lesson_id: int, lesson_data: Dict[str, Any]) -> Optional[TrainingLesson]:
        """Update an existing training lesson"""
        if lesson_id not in self.lessons:
            return None
        
        lesson = self.lessons[lesson_id]
        
        # Update fields
        for field, value in lesson_data.items():
            if hasattr(lesson, field) and value is not None:
                setattr(lesson, field, value)
        
        lesson.updated_date = datetime.now()
        return lesson
    
    def list_lessons(self, published_only: bool = True) -> List[TrainingLesson]:
        """List training lessons"""
        lessons = list(self.lessons.values())
        
        if published_only:
            lessons = [l for l in lessons if l.published]
        
        return sorted(lessons, key=lambda x: x.created_date, reverse=True)
    
    def publish_lesson(self, lesson_id: int) -> bool:
        """Publish a training lesson"""
        if lesson_id not in self.lessons:
            return False
        
        self.lessons[lesson_id].published = True
        self.lessons[lesson_id].updated_date = datetime.now()
        return True
    
    def create_exercise(self, exercise_data: CreateExercise) -> TrainingExercise:
        """Create a new training exercise"""
        exercise_id = max(self.exercises.keys(), default=0) + 1
        
        exercise = TrainingExercise(
            id=exercise_id,
            lesson_id=exercise_data.lesson_id,
            type=exercise_data.type,
            difficulty=exercise_data.difficulty,
            prompt=exercise_data.prompt,
            initial_state=exercise_data.initial_state,
            expected_outcome=exercise_data.expected_outcome,
            scoring_rubric=exercise_data.scoring_rubric,
            time_limit_sec=exercise_data.time_limit_sec,
            hints=exercise_data.hints,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.exercises[exercise_id] = exercise
        return exercise
    
    def update_exercise(self, exercise_id: int, exercise_data: Dict[str, Any]) -> Optional[TrainingExercise]:
        """Update an existing training exercise"""
        if exercise_id not in self.exercises:
            return None
        
        exercise = self.exercises[exercise_id]
        
        # Update fields
        for field, value in exercise_data.items():
            if hasattr(exercise, field) and value is not None:
                setattr(exercise, field, value)
        
        exercise.updated_date = datetime.now()
        return exercise
    
    def list_exercises(self, lesson_id: int) -> List[TrainingExercise]:
        """List exercises for a specific lesson"""
        exercises = [e for e in self.exercises.values() if e.lesson_id == lesson_id]
        return sorted(exercises, key=lambda x: x.created_date)
    
    def start_attempt(self, exercise_id: int, user_id: int) -> Tuple[int, Dict[str, Any]]:
        """Start a new exercise attempt"""
        if exercise_id not in self.exercises:
            raise ValueError("Exercise not found")
        
        exercise = self.exercises[exercise_id]
        attempt_id = max(self.attempts.keys(), default=0) + 1
        
        attempt = TrainingAttempt(
            id=attempt_id,
            exercise_id=exercise_id,
            user_id=user_id,
            started_at=datetime.now(),
            max_score=100.0,
            version_at_attempt=exercise.version if hasattr(exercise, 'version') else "1.0.0",
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.attempts[attempt_id] = attempt
        
        return attempt_id, exercise.initial_state
    
    def score_attempt(self, submission: AttemptSubmission) -> ExerciseResult:
        """Score an exercise attempt based on type"""
        if submission.exercise_id not in self.exercises:
            raise ValueError("Exercise not found")
        
        exercise = self.exercises[submission.exercise_id]
        
        # Find the attempt
        attempt = None
        for a in self.attempts.values():
            if a.exercise_id == submission.exercise_id and a.submitted_at is None:
                attempt = a
                break
        
        if not attempt:
            raise ValueError("No active attempt found")
        
        # Score based on exercise type
        if exercise.type == TrainingExerciseType.METHOD_SETUP:
            score, rubric_breakdown = self._score_method_setup(exercise, submission.answers)
        elif exercise.type == TrainingExerciseType.FAULT_DIAGNOSIS:
            score, rubric_breakdown = self._score_fault_diagnosis(exercise, submission.answers)
        elif exercise.type == TrainingExerciseType.CHROMATOGRAM_QC:
            score, rubric_breakdown = self._score_chromatogram_qc(exercise, submission.answers)
        elif exercise.type == TrainingExerciseType.QUIZ:
            score, rubric_breakdown = self._score_quiz(exercise, submission.answers)
        else:
            raise ValueError(f"Unknown exercise type: {exercise.type}")
        
        # Update attempt
        attempt.submitted_at = datetime.now()
        attempt.answers = submission.answers
        attempt.score = score
        attempt.passed = score >= 70.0  # 70% passing threshold
        attempt.time_taken_sec = submission.time_taken_sec
        attempt.auto_notes = self._generate_auto_notes(exercise, score, rubric_breakdown)
        attempt.updated_date = datetime.now()
        
        return ExerciseResult(
            attempt_id=attempt.id,
            score=score,
            max_score=attempt.max_score,
            passed=attempt.passed,
            rubric_breakdown=rubric_breakdown,
            time_taken_sec=submission.time_taken_sec or 0,
            auto_notes=attempt.auto_notes
        )
    
    def _score_method_setup(self, exercise: TrainingExercise, answers: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        """Score a method setup exercise"""
        rubric = exercise.scoring_rubric
        tolerance = rubric.get("tolerance", {})
        weights = rubric.get("weights", {})
        
        total_score = 0.0
        breakdown = {}
        
        expected = exercise.expected_outcome
        
        for section, section_weight in weights.items():
            if section not in answers or section not in expected:
                continue
            
            section_score = 0.0
            section_breakdown = {}
            
            for param, expected_value in expected[section].items():
                if param in answers[section]:
                    submitted_value = answers[section][param]
                    param_tolerance = tolerance.get(param, 0.0)
                    
                    # Calculate score based on tolerance
                    if isinstance(expected_value, (int, float)):
                        diff = abs(submitted_value - expected_value)
                        if diff <= param_tolerance:
                            param_score = 100.0
                        else:
                            param_score = max(0, 100.0 - (diff / param_tolerance) * 50.0)
                    else:
                        param_score = 100.0 if submitted_value == expected_value else 0.0
                    
                    section_score += param_score
                    section_breakdown[param] = param_score
            
            if section_breakdown:
                section_score /= len(section_breakdown)
                total_score += section_score * section_weight
                breakdown[section] = {
                    "score": section_score,
                    "weight": section_weight,
                    "details": section_breakdown
                }
        
        return total_score, breakdown
    
    def _score_fault_diagnosis(self, exercise: TrainingExercise, answers: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        """Score a fault diagnosis exercise"""
        rubric = exercise.scoring_rubric
        expected_causes = exercise.expected_outcome.get("causes", {})
        expected_solutions = exercise.expected_outcome.get("solutions", {})
        
        submitted_causes = answers.get("causes", [])
        submitted_solutions = answers.get("solutions", [])
        
        # Score causes
        cause_score = 0.0
        for cause, weight in expected_causes.items():
            if cause in submitted_causes:
                cause_score += weight * 100.0
        
        # Score solutions
        solution_score = 0.0
        for solution, weight in expected_solutions.items():
            if solution in submitted_solutions:
                solution_score += weight * 100.0
        
        # Penalize incorrect answers
        incorrect_causes = len([c for c in submitted_causes if c not in expected_causes])
        incorrect_solutions = len([s for s in submitted_solutions if s not in expected_solutions])
        
        penalty = (incorrect_causes + incorrect_solutions) * 10.0
        
        total_score = (cause_score + solution_score) / 2.0 - penalty
        total_score = max(0.0, total_score)
        
        breakdown = {
            "causes": {"score": cause_score, "submitted": submitted_causes},
            "solutions": {"score": solution_score, "submitted": submitted_solutions},
            "penalty": penalty
        }
        
        return total_score, breakdown
    
    def _score_chromatogram_qc(self, exercise: TrainingExercise, answers: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        """Score a chromatogram QC exercise"""
        rubric = exercise.scoring_rubric
        tolerance = rubric.get("tolerance", {})
        
        total_score = 0.0
        breakdown = {}
        
        # Score retention time measurements
        if "retention_times" in answers:
            rt_score = 0.0
            rt_tolerance = tolerance.get("retention_time", 0.1)
            
            for compound, submitted_rt in answers["retention_times"].items():
                expected_rt = exercise.expected_outcome.get("retention_times", {}).get(compound)
                if expected_rt is not None:
                    diff = abs(submitted_rt - expected_rt)
                    if diff <= rt_tolerance:
                        rt_score += 100.0
                    else:
                        rt_score += max(0, 100.0 - (diff / rt_tolerance) * 50.0)
            
            if answers["retention_times"]:
                rt_score /= len(answers["retention_times"])
                total_score += rt_score * 0.4
                breakdown["retention_times"] = {"score": rt_score}
        
        # Score peak identification
        if "peak_identification" in answers:
            peak_score = 0.0
            expected_peaks = exercise.expected_outcome.get("peak_identification", [])
            submitted_peaks = answers["peak_identification"]
            
            correct_peaks = len([p for p in submitted_peaks if p in expected_peaks])
            if expected_peaks:
                peak_score = (correct_peaks / len(expected_peaks)) * 100.0
            
            total_score += peak_score * 0.3
            breakdown["peak_identification"] = {"score": peak_score}
        
        # Score drift detection
        if "drift_detected" in answers:
            expected_drift = exercise.expected_outcome.get("drift_detected", False)
            drift_score = 100.0 if answers["drift_detected"] == expected_drift else 0.0
            total_score += drift_score * 0.3
            breakdown["drift_detection"] = {"score": drift_score}
        
        return total_score, breakdown
    
    def _score_quiz(self, exercise: TrainingExercise, answers: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        """Score a quiz exercise"""
        rubric = exercise.scoring_rubric
        questions = rubric.get("questions", {})
        
        total_score = 0.0
        breakdown = {}
        
        for question_id, question_data in questions.items():
            if question_id in answers:
                submitted_answer = answers[question_id]
                correct_answer = question_data.get("correct_answer")
                question_weight = question_data.get("weight", 1.0)
                
                if isinstance(correct_answer, list):
                    # Multiple choice with multiple correct answers
                    if isinstance(submitted_answer, list):
                        correct_count = len([a for a in submitted_answer if a in correct_answer])
                        incorrect_count = len([a for a in submitted_answer if a not in correct_answer])
                        question_score = max(0, (correct_count - incorrect_count) / len(correct_answer)) * 100.0
                    else:
                        question_score = 0.0
                else:
                    # Single answer
                    if isinstance(correct_answer, str):
                        # String comparison (case-insensitive)
                        question_score = 100.0 if submitted_answer.lower() == correct_answer.lower() else 0.0
                    else:
                        # Exact match
                        question_score = 100.0 if submitted_answer == correct_answer else 0.0
                
                total_score += question_score * question_weight
                breakdown[question_id] = {"score": question_score, "weight": question_weight}
        
        # Normalize to 100
        total_weight = sum(q.get("weight", 1.0) for q in questions.values())
        if total_weight > 0:
            total_score = (total_score / total_weight)
        
        return total_score, breakdown
    
    def _generate_auto_notes(self, exercise: TrainingExercise, score: float, breakdown: Dict[str, Any]) -> str:
        """Generate automatic feedback notes"""
        if score >= 90:
            return "Excellent work! You demonstrated a thorough understanding of the concepts."
        elif score >= 70:
            return "Good work! You have a solid grasp of the material with room for improvement."
        elif score >= 50:
            return "Fair attempt. Review the key concepts and try again."
        else:
            return "This attempt needs improvement. Please review the lesson material and try again."
    
    def get_attempt(self, attempt_id: int) -> Optional[TrainingAttempt]:
        """Get a specific attempt"""
        return self.attempts.get(attempt_id)
    
    def course_progress(self, user_id: int, course_id: int) -> Optional[CourseProgress]:
        """Get course progress for a user"""
        # Find enrollments for this user and course
        user_enrollments = [e for e in self.enrollments.values() 
                          if e.user_id == user_id and e.course_id == course_id]
        
        if not user_enrollments:
            return None
        
        enrollment = user_enrollments[0]
        course = self.courses.get(course_id)
        if not course:
            return None
        
        # Calculate progress
        total_lessons = len(course.lessons_ordered_ids)
        completed_lessons = 0  # This would be calculated from actual lesson completion
        
        # Calculate average score from attempts
        course_exercises = [e for e in self.exercises.values() 
                          if e.lesson_id in course.lessons_ordered_ids]
        exercise_ids = [e.id for e in course_exercises]
        
        course_attempts = [a for a in self.attempts.values() 
                         if a.exercise_id in exercise_ids and a.user_id == user_id]
        
        avg_score = 0.0
        if course_attempts:
            scores = [a.score for a in course_attempts if a.score is not None]
            avg_score = sum(scores) / len(scores) if scores else 0.0
        
        progress_percentage = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0.0
        
        return CourseProgress(
            course_id=course_id,
            user_id=user_id,
            progress_percentage=progress_percentage,
            completed_lessons=completed_lessons,
            total_lessons=total_lessons,
            avg_score=avg_score,
            time_spent_minutes=0,  # Would be calculated from actual time tracking
            last_activity_at=enrollment.last_activity_at if hasattr(enrollment, 'last_activity_at') else None
        )


# Global training service instance
training_service = TrainingService()
