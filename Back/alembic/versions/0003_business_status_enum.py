"""stores: business_verified(boolean) → business_status(enum) + 등록증 컬럼 (M3.B8).

drop+add (33차, 데이터 변환 없음 — dev 검증 데이터 없음 전제).
사업자 검증을 NTS + 등록증 업로드 + 관리자 승인 2단계로 확장:
business_status(UNVERIFIED/PENDING/VERIFIED/REJECTED) + 등록증 경로·반려 사유·심사자.
users.role(관리자)는 PR-B(0004)에서 추가.

Revision ID: 0003_business_status_enum
Revises: 0002_store_business_verify
Create Date: 2026-05-29
"""
from __future__ import annotations

from alembic import op

revision = "0003_business_status_enum"
down_revision = "0002_store_business_verify"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE stores
            DROP COLUMN business_verified,
            ADD COLUMN business_status ENUM('UNVERIFIED','PENDING','VERIFIED','REJECTED')
                NOT NULL DEFAULT 'UNVERIFIED'
                COMMENT 'NTS통과+등록증→PENDING, 관리자 승인→VERIFIED, 반려→REJECTED — 온보딩 게이트'
                AFTER business_no,
            ADD COLUMN business_cert_path VARCHAR(255) NULL
                COMMENT '사업자등록증 파일 경로(서버 볼륨). 원본은 DB 미저장' AFTER business_status,
            ADD COLUMN business_reject_reason VARCHAR(255) NULL
                COMMENT '관리자 반려 사유' AFTER business_cert_path,
            ADD COLUMN business_reviewed_by CHAR(36) NULL
                COMMENT '승인/반려한 관리자 user_id (감사)' AFTER business_reject_reason
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE stores
            DROP COLUMN business_reviewed_by,
            DROP COLUMN business_reject_reason,
            DROP COLUMN business_cert_path,
            DROP COLUMN business_status,
            ADD COLUMN business_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER business_no
        """
    )
