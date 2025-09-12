#!/usr/bin/env python3
"""
Instructor service for IntelliLab GC
Handles course management, enrollments, and grade overrides
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from app.models.schemas import (
    TrainingCourse, Enrollment, CreateCourse, UpdateCourse, AssignCourse,
    GradeOverride, EnrollmentStatus, TrainingAttempt, TrainingLesson
)
from app.services.training_service import training_service


class InstructorService:
    """Instructor service for managing courses and enrollments"""
    
    def __init__(self):
        # In-memory storage for demo (replace with database in production)
        self.courses: Dict[int, TrainingCourse] = {}
        self.enrollments: Dict[int, Enrollment] = {}
        self.grade_overrides: Dict[int, Dict[str, Any]] = {}
        
        # Initialize with sample data
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """Initialize with sample instructor data"""
        # Sample course
        course1 = TrainingCourse(
            id=1,
            title="Advanced GC Method Development",
            description="Advanced techniques in GC method development for complex samples.",
            lessons_ordered_ids=[1, 2],
            published=True,
            author="Dr. Emily Rodriguez",
            est_total_hours=3.0,
            difficulty="advanced",
            tags=["advanced", "method-development", "complex-samples"],
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.courses[1] = course1
        
        # Sample enrollments
        enrollment1 = Enrollment(
            id=1,
            course_id=1,
            user_id=1,
            status=EnrollmentStatus.ACTIVE,
            started_at=datetime.now() - timedelta(days=7),
            progress_percentage=25.0,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        enrollment2 = Enrollment(
            id=2,
            course_id=1,
            user_id=2,
            status=EnrollmentStatus.COMPLETED,
            started_at=datetime.now() - timedelta(days=14),
            completed_at=datetime.now() - timedelta(days=2),
            progress_percentage=100.0,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.enrollments[1] = enrollment1
        self.enrollments[2] = enrollment2
    
    def create_course(self, course_data: CreateCourse, author: str) -> TrainingCourse:
        """Create a new training course"""
        course_id = max(self.courses.keys(), default=0) + 1
        
        course = TrainingCourse(
            id=course_id,
            title=course_data.title,
            description=course_data.description,
            lessons_ordered_ids=course_data.lessons_ordered_ids,
            difficulty=course_data.difficulty,
            tags=course_data.tags,
            est_total_hours=course_data.est_total_hours,
            author=author,
            created_date=datetime.now(),
            updated_date=datetime.now()
        )
        
        self.courses[course_id] = course
        return course
    
    def update_course(self, course_id: int, course_data: UpdateCourse) -> Optional[TrainingCourse]:
        """Update an existing training course"""
        if course_id not in self.courses:
            return None
        
        course = self.courses[course_id]
        
        # Update fields
        for field, value in course_data.dict(exclude_unset=True).items():
            if hasattr(course, field) and value is not None:
                setattr(course, field, value)
        
        course.updated_date = datetime.now()
        return course
    
    def list_courses(self, author: Optional[str] = None) -> List[TrainingCourse]:
        """List training courses"""
        courses = list(self.courses.values())
        
        if author:
            courses = [c for c in courses if c.author == author]
        
        return sorted(courses, key=lambda x: x.created_date, reverse=True)
    
    def publish_course(self, course_id: int) -> bool:
        """Publish a training course"""
        if course_id not in self.courses:
            return False
        
        self.courses[course_id].published = True
        self.courses[course_id].updated_date = datetime.now()
        return True
    
    def assign_course(self, assignment: AssignCourse) -> List[Enrollment]:
        """Assign a course to multiple users"""
        if assignment.course_id not in self.courses:
            raise ValueError("Course not found")
        
        enrollments = []
        
        for user_id in assignment.user_ids:
            # Check if enrollment already exists
            existing_enrollment = None
            for e in self.enrollments.values():
                if e.course_id == assignment.course_id and e.user_id == user_id:
                    existing_enrollment = e
                    break
            
            if existing_enrollment:
                # Update existing enrollment
                existing_enrollment.status = EnrollmentStatus.ACTIVE
                existing_enrollment.updated_date = datetime.now()
                enrollments.append(existing_enrollment)
            else:
                # Create new enrollment
                enrollment_id = max(self.enrollments.keys(), default=0) + 1
                
                enrollment = Enrollment(
                    id=enrollment_id,
                    course_id=assignment.course_id,
                    user_id=user_id,
                    status=EnrollmentStatus.ACTIVE,
                    started_at=datetime.now(),
                    progress_percentage=0.0,
                    created_date=datetime.now(),
                    updated_date=datetime.now()
                )
                
                self.enrollments[enrollment_id] = enrollment
                enrollments.append(enrollment)
        
        return enrollments
    
    def get_course_enrollments(self, course_id: int) -> List[Enrollment]:
        """Get all enrollments for a specific course"""
        enrollments = [e for e in self.enrollments.values() if e.course_id == course_id]
        return sorted(enrollments, key=lambda x: x.created_date)
    
    def get_user_enrollments(self, user_id: int) -> List[Enrollment]:
        """Get all enrollments for a specific user"""
        enrollments = [e for e in self.enrollments.values() if e.user_id == user_id]
        return sorted(enrollments, key=lambda x: x.created_date, reverse=True)
    
    def override_grade(self, attempt_id: int, override_data: GradeOverride, instructor_id: int) -> Optional[TrainingAttempt]:
        """Override a grade for a training attempt"""
        attempt = training_service.get_attempt(attempt_id)
        if not attempt:
            return None
        
        # Apply grade override
        attempt.score = override_data.score
        attempt.passed = override_data.score >= 70.0
        attempt.manual_notes = override_data.manual_notes
        attempt.updated_date = datetime.now()
        
        # Record override
        override_record = {
            "attempt_id": attempt_id,
            "original_score": attempt.score,
            "new_score": override_data.score,
            "reason": override_data.reason,
            "instructor_id": instructor_id,
            "timestamp": datetime.now()
        }
        
        self.grade_overrides[attempt_id] = override_record
        
        return attempt
    
    def get_grade_overrides(self, course_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get grade override history"""
        overrides = list(self.grade_overrides.values())
        
        if course_id:
            # Filter by course (would need to join with attempts and exercises)
            course_exercises = [e for e in training_service.exercises.values() 
                              if e.lesson_id in self.courses.get(course_id, {}).get("lessons_ordered_ids", [])]
            exercise_ids = [e.id for e in course_exercises]
            
            overrides = [o for o in overrides 
                        if o["attempt_id"] in [a.id for a in training_service.attempts.values() 
                                              if a.exercise_id in exercise_ids]]
        
        return sorted(overrides, key=lambda x: x["timestamp"], reverse=True)
    
    def get_course_analytics(self, course_id: int) -> Dict[str, Any]:
        """Get analytics for a specific course"""
        if course_id not in self.courses:
            return {}
        
        course = self.courses[course_id]
        enrollments = self.get_course_enrollments(course_id)
        
        # Calculate analytics
        total_enrollments = len(enrollments)
        active_enrollments = len([e for e in enrollments if e.status == EnrollmentStatus.ACTIVE])
        completed_enrollments = len([e for e in enrollments if e.status == EnrollmentStatus.COMPLETED])
        
        # Calculate average progress
        avg_progress = 0.0
        if enrollments:
            avg_progress = sum(e.progress_percentage for e in enrollments) / len(enrollments)
        
        # Calculate completion rate
        completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0.0
        
        # Get recent activity
        recent_activity = []
        for enrollment in enrollments:
            if enrollment.updated_date > datetime.now() - timedelta(days=7):
                recent_activity.append({
                    "user_id": enrollment.user_id,
                    "status": enrollment.status,
                    "progress": enrollment.progress_percentage,
                    "last_activity": enrollment.updated_date
                })
        
        return {
            "course_id": course_id,
            "course_title": course.title,
            "total_enrollments": total_enrollments,
            "active_enrollments": active_enrollments,
            "completed_enrollments": completed_enrollments,
            "completion_rate": completion_rate,
            "avg_progress": avg_progress,
            "recent_activity": recent_activity,
            "created_date": course.created_date,
            "last_updated": course.updated_date
        }
    
    def get_user_progress(self, user_id: int, course_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed progress for a specific user in a course"""
        enrollment = None
        for e in self.enrollments.values():
            if e.user_id == user_id and e.course_id == course_id:
                enrollment = e
                break
        
        if not enrollment:
            return None
        
        course = self.courses.get(course_id)
        if not course:
            return None
        
        # Get user's attempts for this course
        course_exercises = [e for e in training_service.exercises.values() 
                          if e.lesson_id in course.lessons_ordered_ids]
        exercise_ids = [e.id for e in course_exercises]
        
        user_attempts = [a for a in training_service.attempts.values() 
                        if a.exercise_id in exercise_ids and a.user_id == user_id]
        
        # Calculate detailed progress
        total_attempts = len(user_attempts)
        passed_attempts = len([a for a in user_attempts if a.passed])
        avg_score = 0.0
        if user_attempts:
            scores = [a.score for a in user_attempts if a.score is not None]
            avg_score = sum(scores) / len(scores) if scores else 0.0
        
        # Time spent (estimated)
        time_spent_minutes = sum(a.time_taken_sec or 0 for a in user_attempts) / 60
        
        return {
            "user_id": user_id,
            "course_id": course_id,
            "enrollment_status": enrollment.status,
            "progress_percentage": enrollment.progress_percentage,
            "total_attempts": total_attempts,
            "passed_attempts": passed_attempts,
            "avg_score": avg_score,
            "time_spent_minutes": time_spent_minutes,
            "started_at": enrollment.started_at,
            "last_activity": enrollment.updated_date,
            "attempts": [
                {
                    "attempt_id": a.id,
                    "exercise_id": a.exercise_id,
                    "score": a.score,
                    "passed": a.passed,
                    "submitted_at": a.submitted_at,
                    "time_taken_sec": a.time_taken_sec
                }
                for a in user_attempts
            ]
        }
    
    def add_lesson_to_course(self, course_id: int, lesson_id: int, position: Optional[int] = None) -> bool:
        """Add a lesson to a course at a specific position"""
        if course_id not in self.courses:
            return False
        
        course = self.courses[course_id]
        
        if lesson_id not in training_service.lessons:
            return False
        
        if position is None:
            course.lessons_ordered_ids.append(lesson_id)
        else:
            course.lessons_ordered_ids.insert(position, lesson_id)
        
        course.updated_date = datetime.now()
        return True
    
    def remove_lesson_from_course(self, course_id: int, lesson_id: int) -> bool:
        """Remove a lesson from a course"""
        if course_id not in self.courses:
            return False
        
        course = self.courses[course_id]
        
        if lesson_id in course.lessons_ordered_ids:
            course.lessons_ordered_ids.remove(lesson_id)
            course.updated_date = datetime.now()
            return True
        
        return False
    
    def reorder_course_lessons(self, course_id: int, lesson_order: List[int]) -> bool:
        """Reorder lessons in a course"""
        if course_id not in self.courses:
            return False
        
        course = self.courses[course_id]
        
        # Validate that all lesson IDs exist
        for lesson_id in lesson_order:
            if lesson_id not in training_service.lessons:
                return False
        
        course.lessons_ordered_ids = lesson_order
        course.updated_date = datetime.now()
        return True


# Global instructor service instance
instructor_service = InstructorService()
