import './Skeleton.css';

// Basic skeleton shapes
export const SkeletonText = ({ width = '100%' }) => (
    <div className="skeleton skeleton-text" style={{ width }} />
);

export const SkeletonTextSm = ({ width = '100%' }) => (
    <div className="skeleton skeleton-text-sm" style={{ width }} />
);

export const SkeletonTextLg = ({ width = '100%' }) => (
    <div className="skeleton skeleton-text-lg" style={{ width }} />
);

export const SkeletonCircle = ({ size = 'md' }) => (
    <div className={`skeleton skeleton-circle skeleton-circle-${size}`} />
);

export const SkeletonBox = ({ width = '100%', height = '100px' }) => (
    <div className="skeleton" style={{ width, height }} />
);

// Patients Page Skeleton
export const PatientsSkeleton = () => (
    <div className="patients-skeleton">
        <div className="skeleton-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-stat-card">
                    <SkeletonCircle size="md" />
                    <div className="skeleton-stat-content">
                        <SkeletonTextSm width="50%" />
                        <SkeletonTextLg width="30%" />
                    </div>
                </div>
            ))}
        </div>
        <div className="skeleton-card">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-table-row">
                    <SkeletonText width="15%" />
                    <SkeletonText width="25%" />
                    <SkeletonText width="15%" />
                    <SkeletonText width="10%" />
                    <SkeletonText width="10%" />
                </div>
            ))}
        </div>
    </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5 }) => (
    <div className="skeleton-card">
        {Array(rows).fill(0).map((_, i) => (
            <div key={i} className="skeleton-table-row">
                <SkeletonText width="20%" />
                <SkeletonText width="30%" />
                <SkeletonText width="15%" />
                <SkeletonText width="10%" />
            </div>
        ))}
    </div>
);

export default {
    Text: SkeletonText,
    TextSm: SkeletonTextSm,
    TextLg: SkeletonTextLg,
    Circle: SkeletonCircle,
    Box: SkeletonBox,
    Patients: PatientsSkeleton,
    Table: TableSkeleton,
};
