export type DatabaseProviderName = 'postgres' | 'sql';

export interface DatabaseDefinition {
    name: string;
    provider: DatabaseProviderName;
    version: string;
    tables: Record<string, TableDefinition>;
}

export interface IndexDefinition {
    name: string;
    columns: string[];
    unique?: boolean;
}

export interface TableDefinition {
    name: string;
    columns: Record<string, ColumnDefinition>;
    constraints?: Record<string, ConstraintDefinitions>;
    indexes?: Record<string, IndexDefinition>;
}

export interface ConstraintDefinition {
    name: string;
    type: string;
}

export interface PrimaryKeyConstraintDefinition extends ConstraintDefinition {
    type: 'primary-key',
    column: string;
}

export interface CompositePrimaryKeyConstraintDefinition extends ConstraintDefinition {
    type: 'composite-primary-key';
    columns: string[];
}

export interface UniqueConstraintDefinition extends ConstraintDefinition {
    type: 'unique',
    column: string;
}

export type ConstraintDefinitions = PrimaryKeyConstraintDefinition | UniqueConstraintDefinition | CompositePrimaryKeyConstraintDefinition;

export type ColumnType = 'string' | 'number' | 'boolean' | 'json';

export interface ColumnDefinition {
    name: string;
    type: ColumnType;
    nullable?: boolean;
    overrides?: Partial<Record<DatabaseProviderName, ColumnOverrideDefinition>>;
}


export interface ColumnOverrideDefinition {
    type: string;
    default: string;
}

export interface Migration {
    hash: string;
    /**
     * Actions that must be executed before connecting to the target database (e.g., CREATE DATABASE)
     */
    preDatabaseActions: MigrationActions[];
    /**
     * Actions that must be executed after connecting to the target database (e.g., CREATE TABLE, CREATE INDEX)
     */
    postDatabaseActions: MigrationActions[];
}

export interface MigrationAction {
    type: string;
}

export interface CreateTableMigrationAction extends MigrationAction {
    type: 'create-table';
    definition: TableDefinition;
}

export interface AddColumnMigrationAction extends MigrationAction {
    type: 'add-column';
    table: string;
    definition: ColumnDefinition;
}

export interface CreateDatabaseMigrationAction extends MigrationAction {
    type: 'create-database';
    name: string;
}

export interface RenameTableMigrationAction extends MigrationAction {
    type: 'rename-table';
    from: string;
    to: string;
}

export interface RenameColumnMigrationAction extends MigrationAction {
    type: 'rename-column';
    table: string;
    from: string;
    to: string;
}

export type MigrationActionPolicyStrategy = 'none' | 'archive';

export interface MigrationActionPolicy {
    strategy: MigrationActionPolicyStrategy;
}

export interface ArchiveTableMigrationActionPolicy extends MigrationActionPolicy {
    strategy: 'archive';
    table: string;
}

export interface DropTableMigrationAction extends MigrationAction {
    type: 'drop-table';
    name: string;
    policy?: ArchiveTableMigrationActionPolicy;
}

export interface DropColumnMigrationAction extends MigrationAction {
    type: 'drop-column';
    table: string;
    name: string;
}

/**
 * Recreates a table by:
 * 1. Creating new table with target schema
 * 2. Copying data from old table using bulk copy (INSERT INTO ... SELECT)
 * 3. Creating indexes (deferred until after data load)
 * 4. Dropping old table
 * 5. Renaming new table to original name
 *
 * This approach is faster and more reliable than in-place ALTER operations for:
 * - Column type changes
 * - Nullability changes
 * - Constraint modifications
 * - Index modifications
 * - Any combination of schema changes
 */
export interface RecreateTableMigrationAction extends MigrationAction {
    type: 'recreate-table';
    oldTable: TableDefinition;
    newTable: TableDefinition;
    policy?: ArchiveTableMigrationActionPolicy;
}

export type MigrationActions =
    | CreateTableMigrationAction
    | AddColumnMigrationAction
    | CreateDatabaseMigrationAction
    | RenameTableMigrationAction
    | RenameColumnMigrationAction
    | DropTableMigrationAction
    | DropColumnMigrationAction
    | RecreateTableMigrationAction;