#!/usr/bin/env python3
"""
Backup and Restore service for IntelliLab GC

Supports exporting/importing selec                k: [v.model_dump() if hasattr(v, "model_dump") else v for v in values]ed domains into a ZIP archive containing
JSON files and a manifest. Intended for safe, scoped backups with optional
merge or replace modes on import.
"""

from __future__ import annotations

import io
import json
import os
import tempfile
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Tuple
from zipfile import ZipFile, ZIP_DEFLATED

from loguru import logger

from app.core.database import SessionLocal, Instrument, Method, Calculation, Sample, CostItem, Report
from app.services.audit_service import audit_service
from app.services.qc_service import qc_service
from app.services.quant_service import quant_service
from app.services.sequence_service import sequence_service

# Runs storage is currently in-memory in the runs endpoint module
try:
    from app.api.v1.endpoints.runs import runs_storage  # type: ignore
except Exception:  # pragma: no cover - optional import
    runs_storage = {}


BackupScope = Literal["all", "calibration", "qc", "sequences", "runs", "audit"]
ImportMode = Literal["merge", "replace"]


@dataclass
class BackupManifest:
    version: str
    generated_at: str
    scopes: List[BackupScope]
    app: str = "IntelliLab GC"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "version": self.version,
            "generated_at": self.generated_at,
            "scopes": self.scopes,
            "app": self.app,
        }


class BackupService:
    """Create and restore scoped backups across in-memory and DB-backed data."""

    def __init__(self) -> None:
        self._manifest_version = "1.0"

    # ---------- Export ----------
    def export_backup(self, scope: BackupScope) -> bytes:
        scopes = self._resolve_scopes(scope)
        logger.info(f"Exporting backup for scopes: {scopes}")

        buffer = io.BytesIO()
        with ZipFile(buffer, mode="w", compression=ZIP_DEFLATED) as zf:
            # Manifest
            manifest = BackupManifest(
                version=self._manifest_version,
                generated_at=datetime.utcnow().isoformat() + "Z",
                scopes=scopes,
            )
            zf.writestr("manifest.json", json.dumps(manifest.to_dict(), indent=2))

            # Scope payloads
            if "calibration" in scopes:
                zf.writestr("calibration.json", self._export_calibration())
            if "qc" in scopes:
                zf.writestr("qc.json", self._export_qc())
            if "sequences" in scopes:
                zf.writestr("sequences.json", self._export_sequences())
            if "runs" in scopes:
                zf.writestr("runs.json", self._export_runs())
            if "audit" in scopes:
                zf.writestr("audit.json", self._export_audit())

        buffer.seek(0)
        return buffer.read()

    def _resolve_scopes(self, scope: BackupScope) -> List[BackupScope]:
        if scope == "all":
            return ["calibration", "qc", "sequences", "runs", "audit"]
        return [scope]

    def _export_calibration(self) -> str:
        # quant_service keeps in-memory calibrations and versions
        payload: Dict[str, Any] = {
            "calibrations": {},
            "calibration_versions": {},
            "active_calibrations": {},
        }

        try:
            # These attributes are part of QuantitationService in this codebase
            payload["calibrations"] = {
                key: value.model_dump() if hasattr(value, "model_dump") else value
                for key, value in getattr(quant_service, "calibrations", {}).items()
            }
            payload["calibration_versions"] = {
                key: [v.model_dump() if hasattr(v, "model_dump") else v for v in values]
                for key, values in getattr(quant_service, "calibration_versions", {}).items()
            }
            payload["active_calibrations"] = getattr(quant_service, "active_calibrations", {})
        except Exception as e:
            logger.exception(f"Calibration export failed: {e}")

        return json.dumps(payload, indent=2, default=str)

    def _export_qc(self) -> str:
        payload: Dict[str, Any] = {
            "targets": {},
            "records": {},
            "policy": None,
        }
        try:
            payload["targets"] = {
                k: v.model_dump() if hasattr(v, "model_dump") else v for k, v in getattr(qc_service, "targets", {}).items()
            }
            payload["records"] = {
                k: v.model_dump() if hasattr(v, "model_dump") else v for k, v in getattr(qc_service, "records", {}).items()
            }
            policy = getattr(qc_service, "policy", None)
            payload["policy"] = policy.model_dump() if hasattr(policy, "model_dump") else policy
        except Exception as e:
            logger.exception(f"QC export failed: {e}")
        return json.dumps(payload, indent=2, default=str)

    def _export_sequences(self) -> str:
        payload: Dict[str, Any] = {
            "templates": {},
        }
        try:
            payload["templates"] = {
                k: v.model_dump() if hasattr(v, "model_dump") else v
                for k, v in getattr(sequence_service, "templates", {}).items()
            }
        except Exception as e:
            logger.exception(f"Sequences export failed: {e}")
        return json.dumps(payload, indent=2, default=str)

    def _export_runs(self) -> str:
        payload: Dict[str, Any] = {
            "run_records": {},
            "sequence_runs": {},
        }
        try:
            payload["run_records"] = {
                k: v.model_dump() if hasattr(v, "model_dump") else v for k, v in runs_storage.items()
            }
        except Exception as e:
            logger.exception(f"Run records export failed: {e}")

        try:
            payload["sequence_runs"] = {
                k: v.model_dump() if hasattr(v, "model_dump") else v
                for k, v in getattr(sequence_service, "runs", {}).items()
            }
        except Exception as e:
            logger.exception(f"Sequence runs export failed: {e}")

        return json.dumps(payload, indent=2, default=str)

    def _export_audit(self) -> str:
        try:
            # Large export using existing service capability
            data = audit_service.export_audit_log(format="json")
            return data
        except Exception as e:
            logger.exception(f"Audit export failed: {e}")
            return json.dumps({"entries": []}, indent=2)

    # ---------- Import ----------
    def import_backup(self, zip_bytes: bytes, mode: ImportMode = "merge") -> Dict[str, Any]:
        """
        Import a ZIP archive created by export_backup. Validates manifest and
        applies data per-scope in merge or replace mode.
        """
        summary: Dict[str, Any] = {
            "applied_scopes": [],
            "mode": mode,
        }

        with ZipFile(io.BytesIO(zip_bytes), mode="r") as zf:
            if "manifest.json" not in zf.namelist():
                raise ValueError("Invalid backup: missing manifest.json")

            manifest_data = json.loads(zf.read("manifest.json").decode("utf-8"))
            scopes: List[BackupScope] = manifest_data.get("scopes", [])
            summary["manifest"] = manifest_data

            for scope in scopes:
                handler = getattr(self, f"_import_{scope}", None)
                if handler is None:
                    logger.warning(f"No importer for scope '{scope}', skipping")
                    continue
                filename = f"{scope}.json"
                if filename not in zf.namelist():
                    logger.warning(f"Backup missing {filename} for scope '{scope}', skipping")
                    continue
                try:
                    payload = json.loads(zf.read(filename).decode("utf-8"))
                    handler(payload, mode)
                    summary["applied_scopes"].append(scope)
                except Exception as e:
                    logger.exception(f"Failed to import scope '{scope}': {e}")
                    summary.setdefault("errors", []).append({"scope": scope, "error": str(e)})

        return summary

    def _import_calibration(self, payload: Dict[str, Any], mode: ImportMode) -> None:
        if mode == "replace":
            quant_service.calibrations = {}
            quant_service.calibration_versions = {}
            quant_service.active_calibrations = {}

        calibrations = payload.get("calibrations", {})
        calibration_versions = payload.get("calibration_versions", {})
        active_calibrations = payload.get("active_calibrations", {})

        # Basic merge by key
        quant_service.calibrations.update({k: v for k, v in calibrations.items()})
        quant_service.calibration_versions.update({k: v for k, v in calibration_versions.items()})
        quant_service.active_calibrations.update({k: v for k, v in active_calibrations.items()})

    def _import_qc(self, payload: Dict[str, Any], mode: ImportMode) -> None:
        if mode == "replace":
            qc_service.targets = {}
            qc_service.records = {}

        targets = payload.get("targets", {})
        records = payload.get("records", {})
        policy = payload.get("policy")

        qc_service.targets.update({k: v for k, v in targets.items()})
        qc_service.records.update({k: v for k, v in records.items()})
        if policy is not None:
            qc_service.policy = policy  # Loose assignment; policy is Pydantic-compatible dict

    def _import_sequences(self, payload: Dict[str, Any], mode: ImportMode) -> None:
        if mode == "replace":
            sequence_service.templates = {}

        templates = payload.get("templates", {})
        sequence_service.templates.update({k: v for k, v in templates.items()})

    def _import_runs(self, payload: Dict[str, Any], mode: ImportMode) -> None:
        if mode == "replace":
            try:
                # Clear in-memory structures
                runs_storage.clear()
            except Exception:
                pass
            sequence_service.runs = {}

        run_records = payload.get("run_records", {})
        for k, v in run_records.items():
            runs_storage[int(k) if isinstance(k, str) and k.isdigit() else k] = v

        sequence_runs = payload.get("sequence_runs", {})
        sequence_service.runs.update({k: v for k, v in sequence_runs.items()})


# Global instance
backup_service = BackupService()


