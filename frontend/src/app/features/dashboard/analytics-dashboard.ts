import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { DashboardData } from './dashboard-data';

type DashboardTab = 'outline' | 'past-performance' | 'key-personnel' | 'focus-documents';
type DashboardColumn = 'type' | 'status' | 'target' | 'limit' | 'reviewer';

interface DashboardSection {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
}

interface TabDefinition {
  id: DashboardTab;
  label: string;
  count?: number;
}

const OUTLINE: DashboardSection[] = [
  ['Cover page', 'Cover page', 'In Process', '18', '5', 'Eddie Lake'],
  ['Table of contents', 'Table of contents', 'Done', '29', '24', 'Eddie Lake'],
  ['Executive summary', 'Narrative', 'Done', '10', '13', 'Eddie Lake'],
  ['Technical approach', 'Narrative', 'Done', '27', '23', 'Jamik Tashpulatov'],
  ['Design', 'Narrative', 'In Process', '2', '16', 'Jamik Tashpulatov'],
  ['Capabilities', 'Narrative', 'In Process', '20', '8', 'Jamik Tashpulatov'],
  ['Integration with existing systems', 'Narrative', 'In Process', '19', '21', 'Jamik Tashpulatov'],
  ['Innovation and Advantages', 'Narrative', 'Done', '25', '26', 'Assign reviewer'],
  [
    "Overview of EMR's Innovative Solutions",
    'Technical content',
    'Done',
    '7',
    '23',
    'Assign reviewer',
  ],
  ['Advanced Algorithms and Machine Learning', 'Narrative', 'Done', '30', '28', 'Assign reviewer'],
  ['Adaptive Communication Protocols', 'Narrative', 'Done', '9', '31', 'Assign reviewer'],
  ['Advantages Over Current Technologies', 'Narrative', 'Done', '12', '0', 'Assign reviewer'],
  ['Past Performance', 'Narrative', 'Done', '22', '33', 'Assign reviewer'],
  ['Customer Feedback and Satisfaction Levels', 'Narrative', 'Done', '15', '34', 'Assign reviewer'],
  ['Implementation Challenges and Solutions', 'Narrative', 'Done', '3', '35', 'Assign reviewer'],
  [
    'Security Measures and Data Protection Policies',
    'Narrative',
    'In Process',
    '6',
    '36',
    'Assign reviewer',
  ],
  ['Scalability and Future Proofing', 'Narrative', 'Done', '4', '37', 'Assign reviewer'],
  ['Cost-Benefit Analysis', 'Plain language', 'Done', '14', '38', 'Assign reviewer'],
  ['User Training and Onboarding Experience', 'Narrative', 'Done', '17', '39', 'Assign reviewer'],
  ['Future Development Roadmap', 'Narrative', 'Done', '11', '40', 'Assign reviewer'],
].map(([header, type, status, target, limit, reviewer], index) => ({
  id: index + 1,
  header,
  type,
  status,
  target,
  limit,
  reviewer,
}));

const PAST_PERFORMANCE: DashboardSection[] = [
  [
    'Federal Communications Commission - Network Infrastructure Modernization',
    'Government Contract',
    'Completed',
    '95%',
    '100%',
    'Eddie Lake',
  ],
  [
    'Department of Defense - Cybersecurity Enhancement Program',
    'Defense Contract',
    'Completed',
    '98%',
    '100%',
    'Jamik Tashpulatov',
  ],
  [
    'NASA - Satellite Communication System Upgrade',
    'Space Technology',
    'Completed',
    '92%',
    '95%',
    'Emily Whalen',
  ],
  [
    'Department of Homeland Security - Border Security Tech',
    'Security Contract',
    'In Progress',
    '85%',
    '90%',
    'Eddie Lake',
  ],
  [
    'GSA - Cloud Infrastructure Migration',
    'IT Services',
    'Completed',
    '96%',
    '98%',
    'Jamik Tashpulatov',
  ],
].map(([header, type, status, target, limit, reviewer], index) => ({
  id: index + 101,
  header,
  type,
  status,
  target,
  limit,
  reviewer,
}));

const KEY_PERSONNEL: DashboardSection[] = [
  ['Dr. Sarah Mitchell', 'Project Manager', 'Active', '15 years', '20 years', 'Eddie Lake'],
  ['James Thompson', 'Lead Engineer', 'Active', '12 years', '15 years', 'Jamik Tashpulatov'],
  ['Maria Rodriguez', 'Security Specialist', 'Active', '8 years', '10 years', 'Emily Whalen'],
  ['David Chen', 'Systems Architect', 'Active', '10 years', '12 years', 'Eddie Lake'],
  ['Lisa Johnson', 'Quality Assurance Lead', 'Active', '6 years', '8 years', 'Jamik Tashpulatov'],
].map(([header, type, status, target, limit, reviewer], index) => ({
  id: index + 201,
  header,
  type,
  status,
  target,
  limit,
  reviewer,
}));

const FOCUS_DOCUMENTS: DashboardSection[] = [
  [
    'Technical Specifications Document v2.1',
    'Technical Document',
    'Final',
    '100%',
    '100%',
    'Eddie Lake',
  ],
  [
    'Security Compliance Report Q4 2024',
    'Compliance Document',
    'Under Review',
    '95%',
    '100%',
    'Jamik Tashpulatov',
  ],
  ['Project Management Plan v3.0', 'Management Document', 'Final', '100%', '100%', 'Emily Whalen'],
  ['Risk Assessment Matrix 2025', 'Risk Document', 'Draft', '80%', '90%', 'Eddie Lake'],
  ['Quality Assurance Protocol v1.5', 'QA Document', 'Final', '100%', '100%', 'Jamik Tashpulatov'],
].map(([header, type, status, target, limit, reviewer], index) => ({
  id: index + 301,
  header,
  type,
  status,
  target,
  limit,
  reviewer,
}));

const VISITORS = Array.from({ length: 90 }, (_, index) => ({
  desktop: 130 + ((index * 83 + 47) % 370),
  mobile: 90 + ((index * 61 + 29) % 350),
}));

@Component({
  selector: 'app-analytics-dashboard',
  imports: [HlmButton, HlmInput],
  template: `
    <section class="page-heading compact-heading">
      <div>
        <h1>Dashboard</h1>
        <p>Welcome to your admin dashboard</p>
      </div>
    </section>
    @if (resource.error()) {
      <div class="error-callout" role="alert">{{ resource.error() }}</div>
    }
    <div class="metric-grid summary-metrics">
      @for (metric of metrics; track metric.title) {
        <article class="metric-card">
          <div class="metric-top">
            <i>{{ metric.icon }}</i
            ><b [class.down]="metric.growth < 0"
              >{{ metric.growth > 0 ? '+' : '' }}{{ metric.growth }}%</b
            >
          </div>
          <p>{{ metric.title }}</p>
          <strong>{{ metric.current }}</strong
          ><small>from {{ metric.previous }} ↗</small>
        </article>
      }
    </div>

    <article class="panel visitors-panel">
      <div class="panel-header">
        <div>
          <h2>Total Visitors</h2>
          <p>Total for the last {{ range() === 90 ? '3 months' : range() + ' days' }}</p>
        </div>
        <div class="segmented-control" role="group" aria-label="Visitor date range">
          @for (option of ranges; track option.value) {
            <button
              type="button"
              [class.active]="range() === option.value"
              (click)="range.set(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      </div>
      <div class="visitor-legend">
        <span><i></i>Desktop</span><span><i></i>Mobile</span>
      </div>
      <svg
        class="area-chart"
        viewBox="0 0 900 250"
        preserveAspectRatio="none"
        role="img"
        [attr.aria-label]="'Desktop and mobile visitors for the last ' + range() + ' days'"
      >
        <g class="chart-grid">
          <line x1="0" y1="50" x2="900" y2="50" />
          <line x1="0" y1="100" x2="900" y2="100" />
          <line x1="0" y1="150" x2="900" y2="150" />
          <line x1="0" y1="200" x2="900" y2="200" />
        </g>
        <polyline class="mobile-line" [attr.points]="chartPoints('mobile')" />
        <polyline class="desktop-line" [attr.points]="chartPoints('desktop')" />
      </svg>
    </article>

    <section class="dashboard-table-section">
      <div class="dashboard-table-toolbar">
        <div class="dashboard-tabs" role="tablist" aria-label="Dashboard data views">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="activeTab() === tab.id"
              [class.active]="activeTab() === tab.id"
              (click)="selectTab(tab.id)"
            >
              {{ tab.label }}
              @if (tab.count) {
                <b>{{ tab.count }}</b>
              }
            </button>
          }
        </div>
        <div class="dashboard-table-actions">
          <details>
            <summary>☷ <span>Customize Columns</span>⌄</summary>
            <div class="column-menu">
              @for (column of columnOptions; track column.id) {
                <label
                  ><input
                    type="checkbox"
                    [checked]="visibleColumns()[column.id]"
                    (change)="toggleColumn(column.id)"
                  />{{ column.label }}</label
                >
              }
            </div>
          </details>
          <button hlmBtn variant="outline" size="sm" type="button" (click)="openNew()">
            ＋ Add Section
          </button>
        </div>
      </div>
      <div class="panel data-panel dashboard-outline-table">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th><span class="sr-only">Reorder</span></th>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all rows on page"
                    [checked]="allSelected()"
                    (change)="toggleAll()"
                  />
                </th>
                <th>
                  <button type="button" (click)="sortBy('header')">
                    Header {{ sortMark('header') }}
                  </button>
                </th>
                @if (visibleColumns().type) {
                  <th>
                    <button type="button" (click)="sortBy('type')">
                      Section Type {{ sortMark('type') }}
                    </button>
                  </th>
                }
                @if (visibleColumns().status) {
                  <th>
                    <button type="button" (click)="sortBy('status')">
                      Status {{ sortMark('status') }}
                    </button>
                  </th>
                }
                @if (visibleColumns().target) {
                  <th>Target</th>
                }
                @if (visibleColumns().limit) {
                  <th>Limit</th>
                }
                @if (visibleColumns().reviewer) {
                  <th>
                    <button type="button" (click)="sortBy('reviewer')">
                      Reviewer {{ sortMark('reviewer') }}
                    </button>
                  </th>
                }
                <th><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (row of pagedRows(); track row.id) {
                <tr
                  draggable="true"
                  (dragstart)="startDrag(row.id)"
                  (dragover)="$event.preventDefault()"
                  (drop)="dropOn(row.id)"
                >
                  <td>
                    <button class="drag-handle" type="button" aria-label="Drag to reorder">
                      ⋮⋮
                    </button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      [attr.aria-label]="'Select ' + row.header"
                      [checked]="selected().has(row.id)"
                      (change)="toggleRow(row.id)"
                    />
                  </td>
                  <td>
                    <button class="table-link" type="button" (click)="openEditor(row)">
                      {{ row.header }}
                    </button>
                  </td>
                  @if (visibleColumns().type) {
                    <td>
                      <span class="tag">{{ row.type }}</span>
                    </td>
                  }
                  @if (visibleColumns().status) {
                    <td>
                      <span class="status-pill" [attr.data-status]="statusKey(row.status)"
                        ><i></i>{{ row.status }}</span
                      >
                    </td>
                  }
                  @if (visibleColumns().target) {
                    <td>{{ row.target }}</td>
                  }
                  @if (visibleColumns().limit) {
                    <td>{{ row.limit }}</td>
                  }
                  @if (visibleColumns().reviewer) {
                    <td>{{ row.reviewer }}</td>
                  }
                  <td>
                    <button
                      class="icon-action"
                      type="button"
                      [attr.aria-label]="'Edit ' + row.header"
                      (click)="openEditor(row)"
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="visibleColumnCount()" class="empty-state">No results.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <span>{{ selected().size }} of {{ currentRows().length }} row(s) selected.</span>
          <div>
            <label
              >Rows per page
              <select #sizeSelect [value]="pageSize()" (change)="setPageSize(sizeSelect.value)">
                <option>5</option>
                <option>10</option>
                <option>20</option>
                <option>30</option>
                <option>40</option>
                <option>50</option>
              </select></label
            ><span>Page {{ page() }} of {{ pageCount() }}</span
            ><button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              aria-label="Go to first page"
              [disabled]="page() === 1"
              (click)="page.set(1)"
            >
              «</button
            ><button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              aria-label="Go to previous page"
              [disabled]="page() === 1"
              (click)="page.update((value) => value - 1)"
            >
              ‹</button
            ><button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              aria-label="Go to next page"
              [disabled]="page() === pageCount()"
              (click)="page.update((value) => value + 1)"
            >
              ›</button
            ><button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              aria-label="Go to last page"
              [disabled]="page() === pageCount()"
              (click)="page.set(pageCount())"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </section>

    @if (editorOpen()) {
      <div class="modal-backdrop">
        <section
          class="form-dialog section-editor"
          role="dialog"
          aria-modal="true"
          aria-labelledby="section-editor-title"
        >
          <div class="dialog-header">
            <div>
              <h2 id="section-editor-title">{{ draftId() ? draftHeader() : 'Add section' }}</h2>
              <p>
                {{
                  draftId()
                    ? 'Edit the section details and reviewer.'
                    : 'Create another proposal section.'
                }}
              </p>
            </div>
            <button type="button" aria-label="Close" (click)="editorOpen.set(false)">×</button>
          </div>
          <form (submit)="saveSection($event)">
            <label for="section-header">Header</label
            ><input
              hlmInput
              id="section-header"
              #headerInput
              [value]="draftHeader()"
              (input)="draftHeader.set(headerInput.value)"
              required
            />
            <div class="form-row">
              <div>
                <label for="section-type">Type</label
                ><select
                  id="section-type"
                  #typeInput
                  [value]="draftType()"
                  (change)="draftType.set(typeInput.value)"
                >
                  @for (type of sectionTypes; track type) {
                    <option [selected]="draftType() === type">{{ type }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="section-status">Status</label
                ><select
                  id="section-status"
                  #statusInput
                  [value]="draftStatus()"
                  (change)="draftStatus.set(statusInput.value)"
                >
                  <option>Done</option>
                  <option>In Process</option>
                  <option>Not Started</option>
                  <option>Active</option>
                  <option>Final</option>
                  <option>Under Review</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div>
                <label for="section-target">Target</label
                ><input
                  hlmInput
                  id="section-target"
                  #targetInput
                  [value]="draftTarget()"
                  (input)="draftTarget.set(targetInput.value)"
                />
              </div>
              <div>
                <label for="section-limit">Limit</label
                ><input
                  hlmInput
                  id="section-limit"
                  #limitInput
                  [value]="draftLimit()"
                  (input)="draftLimit.set(limitInput.value)"
                />
              </div>
            </div>
            <label for="section-reviewer">Reviewer</label
            ><select
              id="section-reviewer"
              #reviewerInput
              [value]="draftReviewer()"
              (change)="draftReviewer.set(reviewerInput.value)"
            >
              @for (reviewer of reviewers; track reviewer) {
                <option [selected]="draftReviewer() === reviewer">{{ reviewer }}</option>
              }
            </select>
            <div class="dialog-actions">
              @if (draftId()) {
                <button
                  hlmBtn
                  variant="outline"
                  type="button"
                  class="danger-button"
                  (click)="deleteSection()"
                >
                  Delete
                </button>
              }
              <span></span
              ><button hlmBtn variant="outline" type="button" (click)="editorOpen.set(false)">
                Done</button
              ><button hlmBtn type="submit" [disabled]="!draftHeader().trim()">Submit</button>
            </div>
          </form>
        </section>
      </div>
    }
    @if (notice()) {
      <div class="toast" role="status">✓ {{ notice() }}</div>
    }
  `,
})
export class AnalyticsDashboardPage {
  readonly resource = inject(DashboardData);
  readonly metrics = [
    { title: 'Total Revenue', current: '$1,250', previous: '$1,112', growth: 12.5, icon: '$' },
    { title: 'New Customers', current: '1,234', previous: '1,542', growth: -20, icon: '＋' },
    { title: 'Active Accounts', current: '45,678', previous: '40,602', growth: 12.5, icon: '♙' },
    { title: 'Growth Rate', current: '4.5%', previous: '4.3%', growth: 4.5, icon: '⌁' },
  ];
  readonly ranges = [
    { value: 90, label: 'Last 3 months' },
    { value: 30, label: 'Last 30 days' },
    { value: 7, label: 'Last 7 days' },
  ];
  readonly tabs: TabDefinition[] = [
    { id: 'outline', label: 'Outline' },
    { id: 'past-performance', label: 'Past Performance', count: 3 },
    { id: 'key-personnel', label: 'Key Personnel', count: 2 },
    { id: 'focus-documents', label: 'Focus Documents' },
  ];
  readonly columnOptions: { id: DashboardColumn; label: string }[] = [
    { id: 'type', label: 'Section Type' },
    { id: 'status', label: 'Status' },
    { id: 'target', label: 'Target' },
    { id: 'limit', label: 'Limit' },
    { id: 'reviewer', label: 'Reviewer' },
  ];
  readonly sectionTypes = [
    'Table of Contents',
    'Executive Summary',
    'Technical Approach',
    'Design',
    'Capabilities',
    'Focus Documents',
    'Narrative',
    'Cover Page',
  ];
  readonly reviewers = ['Assign reviewer', 'Eddie Lake', 'Jamik Tashpulatov', 'Emily Whalen'];
  readonly range = signal(90);
  readonly activeTab = signal<DashboardTab>('outline');
  readonly rows = signal<Record<DashboardTab, DashboardSection[]>>({
    outline: OUTLINE,
    'past-performance': PAST_PERFORMANCE,
    'key-personnel': KEY_PERSONNEL,
    'focus-documents': FOCUS_DOCUMENTS,
  });
  readonly selected = signal(new Set<number>());
  readonly visibleColumns = signal<Record<DashboardColumn, boolean>>({
    type: true,
    status: true,
    target: true,
    limit: true,
    reviewer: true,
  });
  readonly sortColumn = signal<'header' | 'type' | 'status' | 'reviewer' | null>(null);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly editorOpen = signal(false);
  readonly draftId = signal(0);
  readonly draftHeader = signal('');
  readonly draftType = signal('Narrative');
  readonly draftStatus = signal('Not Started');
  readonly draftTarget = signal('0');
  readonly draftLimit = signal('0');
  readonly draftReviewer = signal('Assign reviewer');
  readonly notice = signal('');
  private readonly draggedId = signal<number | null>(null);
  readonly currentRows = computed(() => this.rows()[this.activeTab()]);
  readonly sortedRows = computed(() => {
    const column = this.sortColumn();
    if (!column) return this.currentRows();
    return [...this.currentRows()].sort((left, right) => {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      return left[column].localeCompare(right[column]) * direction;
    });
  });
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.sortedRows().length / this.pageSize())),
  );
  readonly pagedRows = computed(() =>
    this.sortedRows().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()),
  );
  readonly allSelected = computed(
    () =>
      this.pagedRows().length > 0 && this.pagedRows().every((row) => this.selected().has(row.id)),
  );
  readonly visibleColumnCount = computed(
    () => 4 + Object.values(this.visibleColumns()).filter(Boolean).length,
  );

  chartPoints(key: 'desktop' | 'mobile'): string {
    const values = VISITORS.slice(-this.range());
    return values
      .map(
        (item, index) =>
          `${(index / Math.max(1, values.length - 1)) * 900},${235 - item[key] / 2.25}`,
      )
      .join(' ');
  }
  selectTab(tab: DashboardTab): void {
    this.activeTab.set(tab);
    this.page.set(1);
    this.selected.set(new Set());
  }
  toggleColumn(column: DashboardColumn): void {
    this.visibleColumns.update((columns) => ({ ...columns, [column]: !columns[column] }));
  }
  toggleRow(id: number): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  toggleAll(): void {
    const checked = this.allSelected();
    this.selected.update((current) => {
      const next = new Set(current);
      for (const row of this.pagedRows()) {
        if (checked) next.delete(row.id);
        else next.add(row.id);
      }
      return next;
    });
  }
  sortBy(column: 'header' | 'type' | 'status' | 'reviewer'): void {
    if (this.sortColumn() === column)
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.page.set(1);
  }
  sortMark(column: string): string {
    return this.sortColumn() === column ? (this.sortDirection() === 'asc' ? '↑' : '↓') : '↕';
  }
  setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
  }
  startDrag(id: number): void {
    this.draggedId.set(id);
  }
  dropOn(targetId: number): void {
    const sourceId = this.draggedId();
    if (sourceId === null || sourceId === targetId) return;
    const tab = this.activeTab();
    const items = [...this.currentRows()];
    const source = items.findIndex((row) => row.id === sourceId);
    const target = items.findIndex((row) => row.id === targetId);
    if (source < 0 || target < 0) return;
    const [moved] = items.splice(source, 1);
    items.splice(target, 0, moved);
    this.rows.update((all) => ({ ...all, [tab]: items }));
    this.sortColumn.set(null);
    this.draggedId.set(null);
    this.flash('Section reordered');
  }
  openNew(): void {
    this.draftId.set(0);
    this.draftHeader.set('');
    this.draftType.set('Narrative');
    this.draftStatus.set('Not Started');
    this.draftTarget.set('0');
    this.draftLimit.set('0');
    this.draftReviewer.set('Assign reviewer');
    this.editorOpen.set(true);
  }
  openEditor(row: DashboardSection): void {
    this.draftId.set(row.id);
    this.draftHeader.set(row.header);
    this.draftType.set(row.type);
    this.draftStatus.set(row.status);
    this.draftTarget.set(row.target);
    this.draftLimit.set(row.limit);
    this.draftReviewer.set(row.reviewer);
    this.editorOpen.set(true);
  }
  saveSection(event: Event): void {
    event.preventDefault();
    const tab = this.activeTab();
    const id = this.draftId() || Math.max(0, ...this.currentRows().map((row) => row.id)) + 1;
    const saved: DashboardSection = {
      id,
      header: this.draftHeader().trim(),
      type: this.draftType(),
      status: this.draftStatus(),
      target: this.draftTarget(),
      limit: this.draftLimit(),
      reviewer: this.draftReviewer(),
    };
    this.rows.update((all) => ({
      ...all,
      [tab]: all[tab].some((row) => row.id === id)
        ? all[tab].map((row) => (row.id === id ? saved : row))
        : [saved, ...all[tab]],
    }));
    this.editorOpen.set(false);
    this.flash(this.draftId() ? 'Section updated' : 'Section added');
  }
  deleteSection(): void {
    const tab = this.activeTab();
    const id = this.draftId();
    this.rows.update((all) => ({ ...all, [tab]: all[tab].filter((row) => row.id !== id) }));
    this.selected.update((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    this.editorOpen.set(false);
    this.flash('Section deleted');
  }
  statusKey(value: string): string {
    const normalized = value.toLowerCase();
    return normalized === 'done' ||
      normalized === 'completed' ||
      normalized === 'active' ||
      normalized === 'final'
      ? 'done'
      : normalized.includes('process') || normalized.includes('review')
        ? 'in_progress'
        : 'backlog';
  }
  private flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 2200);
  }
}
