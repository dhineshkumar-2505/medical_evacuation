import './Skeleton.css';

// Basic skeleton shapes
export const SkeletonText = ({ width = '100%', className = '' }) => (
    <div className={`skeleton skeleton-text ${className}`} style={{ width }} />
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

// Dashboard Stats Skeleton
export const DashboardSkeleton = () => (
    <div className="dashboard-skeleton">
        <div className="skeleton-stats-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-stat-card">
                    <SkeletonCircle size="lg" />
                    <div className="skeleton-stat-content">
                        <SkeletonTextSm width="60%" />
                        <SkeletonTextLg width="40%" />
                        <SkeletonTextSm width="80%" />
                    </div>
                </div>
            ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <SkeletonBox height="300px" />
            <div className="skeleton-card">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton-table-row">
                        <SkeletonCircle size="sm" />
                        <div style={{ flex: 1 }}>
                            <SkeletonText width="70%" />
                            <SkeletonTextSm width="50%" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
    <div className="skeleton-table">
        {Array(rows).fill(0).map((_, i) => (
            <div key={i} className="skeleton-table-row">
                {Array(columns).fill(0).map((_, j) => (
                    <div key={j} className="skeleton-table-cell">
                        <SkeletonText width={j === 0 ? '80%' : '60%'} />
                    </div>
                ))}
            </div>
        ))}
    </div>
);

// Card Skeleton
export const CardSkeleton = () => (
    <div className="skeleton-card">
        <SkeletonTextLg width="50%" />
        <SkeletonText />
        <SkeletonText />
        <SkeletonText width="70%" />
    </div>
);

export default {
    Text: SkeletonText,
    TextSm: SkeletonTextSm,
    TextLg: SkeletonTextLg,
    Circle: SkeletonCircle,
    Box: SkeletonBox,
    Dashboard: DashboardSkeleton,
    Table: TableSkeleton,
    Card: CardSkeleton,
};
