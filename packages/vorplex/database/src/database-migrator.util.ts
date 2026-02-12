import { $Hash } from '@vorplex/core';
import * as mssql from 'mssql';
import { Client, PoolClient } from 'pg';
import { ColumnDefinition, ColumnOverrideDefinition, ColumnType, CompositePrimaryKeyConstraintDefinition, ConstraintDefinitions, DatabaseDefinition, DatabaseProviderName, IndexDefinition, Migration, MigrationActionPolicyStrategy, MigrationActions, PrimaryKeyConstraintDefinition, TableDefinition, UniqueConstraintDefinition } from './database-definition.interface';

export interface DatabaseProviderConfig {
    provider: DatabaseProviderName;
    host: string;
    port?: number;
    user: string;
    password: string;
    database?: string;
}

export class $DatabaseMigrator {

    public static async generateMigration(from: DatabaseDefinition | null, to: DatabaseDefinition, options?: { strategy: MigrationActionPolicyStrategy }): Promise<Migration> {
        const actions: MigrationActions[] = [];

        // Database doesn't exist - create everything
        if (from === null) {
            const preDatabaseActions: MigrationActions[] = [
                {
                    type: 'create-database',
                    name: to.name
                }
            ];

            const postDatabaseActions: MigrationActions[] = [];

            // Create all tables (indexes are created as part of table definition)
            for (const toTable of Object.values(to.tables)) {
                postDatabaseActions.push({
                    type: 'create-table',
                    definition: toTable
                });
            }

            return {
                hash: null,
                preDatabaseActions,
                postDatabaseActions
            };
        }

        // Detect dropped tables
        for (const [tableId, fromTable] of Object.entries(from.tables)) {
            if (!to.tables[tableId]) {
                actions.push({
                    type: 'drop-table',
                    name: fromTable.name,
                    policy: options?.strategy === 'archive'
                        ? {
                            strategy: 'archive',
                            table: `${fromTable.name}_archive_${from.version.replace(/\./g, '_')}`
                        }
                        : undefined
                });
            }
        }

        // Process each table
        for (const [tableId, toTable] of Object.entries(to.tables)) {
            const fromTable = from.tables[tableId];

            // New table - create it
            if (!fromTable) {
                actions.push({
                    type: 'create-table',
                    definition: toTable
                });
                continue;
            }

            // Table exists - check if we need to recreate or just rename
            const needsRecreation = this.tableNeedsRecreation(fromTable, toTable, from.provider);

            if (needsRecreation) {
                // Recreate the entire table (handles all schema changes)
                actions.push({
                    type: 'recreate-table',
                    oldTable: fromTable,
                    newTable: toTable,
                    policy: options?.strategy === 'archive'
                        ? {
                            strategy: 'archive',
                            table: `${fromTable.name}_archive_${from.version.replace(/\./g, '_')}`
                        }
                        : undefined
                });
            } else {
                // Only metadata changes needed

                // Handle table rename (metadata-only, safe)
                if (fromTable.name !== toTable.name) {
                    actions.push({
                        type: 'rename-table',
                        from: fromTable.name,
                        to: toTable.name
                    });
                }

                // Handle column renames (metadata-only, safe)
                for (const [columnId, toColumn] of Object.entries(toTable.columns)) {
                    const fromColumn = fromTable.columns[columnId];
                    if (fromColumn && fromColumn.name !== toColumn.name) {
                        actions.push({
                            type: 'rename-column',
                            table: toTable.name,
                            from: fromColumn.name,
                            to: toColumn.name
                        });
                    }
                }

                // Handle new nullable columns (safe, metadata-only)
                for (const [columnId, toColumn] of Object.entries(toTable.columns)) {
                    if (!fromTable.columns[columnId] && (toColumn.nullable ?? true)) {
                        actions.push({
                            type: 'add-column',
                            table: toTable.name,
                            definition: toColumn
                        });
                    }
                }

                // Handle dropped columns (safe)
                for (const [columnId, fromColumn] of Object.entries(fromTable.columns)) {
                    if (!toTable.columns[columnId]) {
                        actions.push({
                            type: 'drop-column',
                            table: toTable.name,
                            name: fromColumn.name
                        });
                    }
                }
            }
        }

        return {
            hash: await $Hash.generateSha256Base64(from),
            preDatabaseActions: [],
            postDatabaseActions: actions
        };
    }

    /**
     * Determines if a table needs to be recreated based on schema changes.
     * Returns true for any changes beyond simple metadata operations.
     *
     * Note: This compares tables from the SAME provider (e.g., comparing current postgres DB to desired postgres schema).
     * Overrides are compared only for the provider being used, not all providers.
     */
    private static tableNeedsRecreation(fromTable: TableDefinition, toTable: TableDefinition, provider: DatabaseProviderName): boolean {
        // Check for column type changes
        for (const [columnId, fromColumn] of Object.entries(fromTable.columns)) {
            const toColumn = toTable.columns[columnId];
            if (toColumn) {
                // Column type changed
                if (fromColumn.type !== toColumn.type) return true;

                // Column overrides changed (only compare the current provider's overrides)
                // When comparing, we only care about the override for the provider we're actually using
                const fromOverride = fromColumn.overrides?.[provider];
                const toOverride = toColumn.overrides?.[provider];
                if (JSON.stringify(fromOverride ?? null) !== JSON.stringify(toOverride ?? null)) return true;

                // Nullability changed
                if ((fromColumn.nullable ?? true) !== (toColumn.nullable ?? true)) return true;
            }
        }

        // Check for new non-nullable columns (requires default value handling)
        for (const [columnId, toColumn] of Object.entries(toTable.columns)) {
            if (!fromTable.columns[columnId] && !(toColumn.nullable ?? true)) {
                return true;
            }
        }

        // Check for constraint changes (semantic comparison, ignoring database-generated names)
        if (!this.constraintsMatch(fromTable.constraints ?? {}, toTable.constraints ?? {})) {
            return true;
        }

        // Check for index changes (semantic comparison, ignoring database-generated names)
        if (!this.indexesMatch(fromTable.indexes ?? {}, toTable.indexes ?? {})) {
            return true;
        }

        return false;
    }

    /**
     * Compares constraints semantically, ignoring database-generated names.
     * Constraints are considered equal if they have the same semantic keys and types.
     */
    private static constraintsMatch(
        fromConstraints: Record<string, ConstraintDefinitions>,
        toConstraints: Record<string, ConstraintDefinitions>
    ): boolean {
        const fromKeys = Object.keys(fromConstraints).sort();
        const toKeys = Object.keys(toConstraints).sort();

        // Different number of constraints
        if (fromKeys.length !== toKeys.length) return false;

        // Different semantic keys
        if (JSON.stringify(fromKeys) !== JSON.stringify(toKeys)) return false;

        // Check each constraint's type and columns (ignore name field)
        for (const key of fromKeys) {
            const fromConstraint = fromConstraints[key];
            const toConstraint = toConstraints[key];

            if (fromConstraint.type !== toConstraint.type) return false;

            if (fromConstraint.type === 'primary-key' && toConstraint.type === 'primary-key') {
                if (fromConstraint.column !== toConstraint.column) return false;
            } else if (fromConstraint.type === 'composite-primary-key' && toConstraint.type === 'composite-primary-key') {
                if (JSON.stringify(fromConstraint.columns) !== JSON.stringify(toConstraint.columns)) return false;
            } else if (fromConstraint.type === 'unique' && toConstraint.type === 'unique') {
                if (fromConstraint.column !== toConstraint.column) return false;
            }
        }

        return true;
    }

    /**
     * Compares indexes semantically, ignoring database-generated names.
     * Indexes are considered equal if they have the same semantic keys, columns, and uniqueness.
     */
    private static indexesMatch(
        fromIndexes: Record<string, IndexDefinition>,
        toIndexes: Record<string, IndexDefinition>
    ): boolean {
        const fromKeys = Object.keys(fromIndexes).sort();
        const toKeys = Object.keys(toIndexes).sort();

        // Different number of indexes
        if (fromKeys.length !== toKeys.length) return false;

        // Different semantic keys
        if (JSON.stringify(fromKeys) !== JSON.stringify(toKeys)) return false;

        // Check each index's columns and uniqueness (ignore name field)
        for (const key of fromKeys) {
            const fromIndex = fromIndexes[key];
            const toIndex = toIndexes[key];

            if (JSON.stringify(fromIndex.columns) !== JSON.stringify(toIndex.columns)) return false;
            if ((fromIndex.unique ?? false) !== (toIndex.unique ?? false)) return false;
        }

        return true;
    }

    /**
     * Generates SQL queries for pre-database migration actions (e.g., CREATE DATABASE).
     * These queries must be executed with a connection to the server WITHOUT specifying a database.
     */
    public static generatePreDatabaseMigrationQuery(provider: DatabaseProviderName, migration: Migration): string[] {
        return migration.preDatabaseActions.map(action => DatabaseTranslator.getMigrationActionQuery(provider, action));
    }

    /**
     * Generates SQL queries for post-database migration actions (e.g., CREATE TABLE, CREATE INDEX).
     * These queries must be executed with a connection to the TARGET database.
     */
    public static generatePostDatabaseMigrationQuery(provider: DatabaseProviderName, migration: Migration): string[] {
        return migration.postDatabaseActions.map(action => DatabaseTranslator.getMigrationActionQuery(provider, action));
    }

    /**
     * Generates all SQL queries for the migration.
     * Note: If preDatabaseActions exist, you must reconnect to the created database before executing postDatabaseActions.
     */
    public static generateMigrationQuery(provider: DatabaseProviderName, migration: Migration): string[] {
        return [
            ...migration.preDatabaseActions.map(action => DatabaseTranslator.getMigrationActionQuery(provider, action)),
            ...migration.postDatabaseActions.map(action => DatabaseTranslator.getMigrationActionQuery(provider, action))
        ];
    }

    public static async generateDatabaseDefinition(providerConfig: DatabaseProviderConfig): Promise<DatabaseDefinition | null> {
        if (!providerConfig.database) {
            throw new Error('Database name is required to generate database definition');
        }

        if (providerConfig.provider === 'postgres') {
            const client = new Client({
                host: providerConfig.host,
                port: providerConfig.port || 5432,
                user: providerConfig.user,
                password: providerConfig.password,
                database: 'postgres' // Connect to default postgres database first
            });

            try {
                await client.connect();

                // Check if the target database exists
                const result = await client.query(
                    'SELECT 1 FROM pg_database WHERE datname = $1',
                    [providerConfig.database]
                );

                if (result.rows.length === 0) {
                    return null;
                }

                await client.end();

                // Reconnect to the target database
                const targetClient = new Client({
                    host: providerConfig.host,
                    port: providerConfig.port || 5432,
                    user: providerConfig.user,
                    password: providerConfig.password,
                    database: providerConfig.database
                });

                try {
                    await targetClient.connect();
                    return await DatabaseTranslator.generateDefinition('postgres', targetClient);
                } finally {
                    await targetClient.end();
                }
            } catch (error) {
                await client.end();
                throw error;
            }
        } else if (providerConfig.provider === 'sql') {
            const config: mssql.config = {
                server: providerConfig.host,
                port: providerConfig.port || 1433,
                user: providerConfig.user,
                password: providerConfig.password,
                options: {
                    encrypt: true,
                    trustServerCertificate: true
                }
            };

            const connection = new mssql.ConnectionPool(config);

            try {
                await connection.connect();

                // Check if the target database exists
                const result = await connection.request().query(
                    `SELECT 1 FROM sys.databases WHERE name = '${providerConfig.database}'`
                );

                if (result.recordset.length === 0) {
                    return null;
                }

                await connection.close();

                // Reconnect to the target database
                const targetConfig: mssql.config = {
                    server: providerConfig.host,
                    port: providerConfig.port || 1433,
                    user: providerConfig.user,
                    password: providerConfig.password,
                    database: providerConfig.database,
                    options: {
                        encrypt: true,
                        trustServerCertificate: true
                    }
                };

                const targetConnection = new mssql.ConnectionPool(targetConfig);

                try {
                    await targetConnection.connect();
                    return await DatabaseTranslator.generateDefinition('sql', targetConnection);
                } finally {
                    await targetConnection.close();
                }
            } catch (error) {
                await connection.close();
                throw error;
            }
        } else {
            throw new Error(`Unsupported provider: ${providerConfig.provider}`);
        }
    }

    /**
     * Executes migrations against a database.
     * - Creates direct connections (no pooling)
     * - Wraps post-database queries in a transaction
     * - Handles pre-database actions (CREATE DATABASE) separately from post-database actions
     */
    public static async executeMigrations(providerConfig: DatabaseProviderConfig, migrations: Migration[]): Promise<void> {
        if (providerConfig.provider === 'postgres') {
            await this.executePostgresMigrations(providerConfig, migrations);
        } else if (providerConfig.provider === 'sql') {
            await this.executeSqlServerMigrations(providerConfig, migrations);
        } else {
            throw new Error(`Unsupported provider: ${providerConfig.provider}`);
        }
    }

    private static async executePostgresMigrations(providerConfig: DatabaseProviderConfig, migrations: Migration[]): Promise<void> {
        for (const migration of migrations) {
            // Execute pre-database actions (e.g., CREATE DATABASE) without specifying a database
            if (migration.preDatabaseActions.length > 0) {
                const client = new Client({
                    host: providerConfig.host,
                    port: providerConfig.port || 5432,
                    user: providerConfig.user,
                    password: providerConfig.password,
                    database: 'postgres' // Connect to default postgres database
                });

                try {
                    await client.connect();

                    for (const action of migration.preDatabaseActions) {
                        const query = DatabaseTranslator.getMigrationActionQuery('postgres', action);
                        await client.query(query);
                    }
                } finally {
                    await client.end();
                }
            }

            // Execute post-database actions (e.g., CREATE TABLE, CREATE INDEX) in a transaction
            if (migration.postDatabaseActions.length > 0) {
                const targetDatabase = providerConfig.database;
                if (!targetDatabase) {
                    throw new Error('Database name is required for post-database migration actions');
                }

                const client = new Client({
                    host: providerConfig.host,
                    port: providerConfig.port || 5432,
                    user: providerConfig.user,
                    password: providerConfig.password,
                    database: targetDatabase
                });

                try {
                    await client.connect();
                    await client.query('BEGIN');

                    for (const action of migration.postDatabaseActions) {
                        const query = DatabaseTranslator.getMigrationActionQuery('postgres', action);
                        await client.query(query);
                    }

                    await client.query('COMMIT');
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                } finally {
                    await client.end();
                }
            }
        }
    }

    private static async executeSqlServerMigrations(providerConfig: DatabaseProviderConfig, migrations: Migration[]): Promise<void> {
        for (const migration of migrations) {
            // Execute pre-database actions (e.g., CREATE DATABASE) without specifying a database
            if (migration.preDatabaseActions.length > 0) {
                const config: mssql.config = {
                    server: providerConfig.host,
                    port: providerConfig.port || 1433,
                    user: providerConfig.user,
                    password: providerConfig.password,
                    options: {
                        encrypt: true,
                        trustServerCertificate: true
                    }
                };

                const connection = new mssql.ConnectionPool(config);

                try {
                    await connection.connect();

                    for (const action of migration.preDatabaseActions) {
                        const query = DatabaseTranslator.getMigrationActionQuery('sql', action);
                        await connection.request().query(query);
                    }
                } finally {
                    await connection.close();
                }
            }

            // Execute post-database actions (e.g., CREATE TABLE, CREATE INDEX) in a transaction
            if (migration.postDatabaseActions.length > 0) {
                const targetDatabase = providerConfig.database;
                if (!targetDatabase) {
                    throw new Error('Database name is required for post-database migration actions');
                }

                const config: mssql.config = {
                    server: providerConfig.host,
                    port: providerConfig.port || 1433,
                    user: providerConfig.user,
                    password: providerConfig.password,
                    database: targetDatabase,
                    options: {
                        encrypt: true,
                        trustServerCertificate: true
                    }
                };

                const connection = new mssql.ConnectionPool(config);

                try {
                    await connection.connect();
                    const transaction = new mssql.Transaction(connection);
                    await transaction.begin();

                    try {
                        for (const action of migration.postDatabaseActions) {
                            const query = DatabaseTranslator.getMigrationActionQuery('sql', action);
                            await transaction.request().query(query);
                        }

                        await transaction.commit();
                    } catch (error) {
                        // SQL Server automatically aborts transactions on certain errors
                        // Attempt rollback but ignore errors if transaction was already aborted
                        try {
                            await transaction.rollback();
                        } catch (rollbackError) {
                            // Transaction was already aborted, ignore rollback error
                        }
                        throw error;
                    }
                } finally {
                    await connection.close();
                }
            }
        }
    }

}

export const PostgresColumnType = {
    text: 'TEXT',
    bigInt: 'BIGINT',
    boolean: 'BOOLEAN',
    jsonb: 'JSONB'
} as const;
export type PostgresColumnType = typeof PostgresColumnType[keyof typeof PostgresColumnType];

export const SqlServerColumnType = {
    nvarchar: 'NVARCHAR(MAX)',
    bigInt: 'BIGINT',
    bit: 'BIT',
    nvarcharMax: 'NVARCHAR(MAX)'
} as const;
export type SqlServerColumnType = typeof SqlServerColumnType[keyof typeof SqlServerColumnType];

export interface DatabaseProvider<T = any> {
    name: DatabaseProviderName;
    columnMappings: Record<ColumnType, {
        type: string,
        default: string
    }>;
    actions: {
        [K in MigrationActions['type']]: (action: Extract<MigrationActions, { type: K }>) => string;
    };
    generateDefinition: (client: T) => Promise<DatabaseDefinition>
}

export class DatabaseTranslator {

    public static providers: Record<DatabaseProviderName, DatabaseProvider> = {
        postgres: {
            name: 'postgres',
            columnMappings: {
                string: {
                    type: PostgresColumnType.text,
                    default: `''`
                },
                number: {
                    type: PostgresColumnType.bigInt,
                    default: `0`
                },
                boolean: {
                    type: PostgresColumnType.boolean,
                    default: `FALSE`
                },
                json: {
                    type: PostgresColumnType.jsonb,
                    default: `'null':jsonb`
                }
            },
            generateDefinition: async (client: PoolClient) => {
                // 1️⃣ Fetch tables
                const tablesRes = await client.query(`
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_type='BASE TABLE';
                `);

                const tables: Record<string, TableDefinition> = {};

                for (const row of tablesRes.rows) {
                    const tableName = row.table_name;

                    // 2️⃣ Fetch columns
                    const columnsRes = await client.query(`
                        SELECT column_name, is_nullable, data_type
                        FROM information_schema.columns
                        WHERE table_name = $1
                        ORDER BY ordinal_position;
                    `, [tableName]);

                    const columns: Record<string, ColumnDefinition> = {};
                    for (const col of columnsRes.rows) {
                        let type: ColumnType;
                        let override: ColumnOverrideDefinition;
                        let sqlOverride: ColumnOverrideDefinition;
                        switch (col.data_type) {
                            case 'bigint':
                            case 'integer':
                            case 'numeric':
                            case 'smallint':
                                type = 'number';
                                override = { type: col.data_type, default: '0' };
                                break;
                            case 'boolean':
                                type = 'boolean';
                                break;
                            case 'uuid':
                                type = 'string';
                                override = { type: 'UUID', default: 'uuidv7()' };
                                sqlOverride = { type: 'UNIQUEIDENTIFIER', default: 'NEWSEQUENTIALID()' };
                                break;
                            default:
                                type = 'string';
                        }

                        columns[col.column_name] = {
                            name: col.column_name,
                            type,
                            nullable: col.is_nullable === 'YES',
                            ...(override ? { overrides: { postgres: override, sql: sqlOverride } } : {})
                        };
                    }

                    // 3️⃣ Fetch constraints
                    const constraintsRes = await client.query(`
                        SELECT
                            tc.constraint_name,
                            tc.constraint_type,
                            kcu.column_name
                        FROM
                            information_schema.table_constraints AS tc
                        LEFT JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        WHERE tc.table_name = $1 AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');
                    `, [tableName]);

                    const constraints: Record<string, ConstraintDefinitions> = {};
                    for (const c of constraintsRes.rows) {
                        if (c.constraint_type === 'PRIMARY KEY') {
                            const constraint: PrimaryKeyConstraintDefinition = { name: c.constraint_name, type: 'primary-key', column: c.column_name };
                            constraints[`pk:${c.column_name}`] = constraint;
                        } else if (c.constraint_type === 'UNIQUE') {
                            const constraint: UniqueConstraintDefinition = { name: c.constraint_name, type: 'unique', column: c.column_name };
                            constraints[`unique:${c.column_name}`] = constraint;
                            if (columns[c.column_name].type === 'string' && !columns[c.column_name].overrides?.sql) columns[c.column_name].overrides = Object.assign({}, columns[c.column_name].overrides, { sql: { type: 'NVARCHAR(450)', default: `''` } });
                        }
                    }

                    // 4️⃣ Fetch indexes
                    const indexesRes = await client.query(`
                        SELECT
                            indexname,
                            indexdef
                        FROM
                            pg_indexes
                        WHERE tablename = $1;
                    `, [tableName]);

                    // Get constraint names to exclude their indexes
                    const constraintNames = Object.values(constraints).map(c => c.name);

                    const indexes: Record<string, IndexDefinition> = {};
                    for (const idx of indexesRes.rows) {
                        // Skip indexes that are managed by constraints
                        if (constraintNames.includes(idx.indexname)) {
                            continue;
                        }

                        // Simple parsing, assumes standard format: CREATE [UNIQUE] INDEX name ON table (col1, col2)
                        const match = idx.indexdef.match(/\((.+)\)/);
                        if (match) {
                            const cols = match[1].split(',').map(s => s.trim().replace(/"/g, ''));
                            const isUnique = idx.indexdef.startsWith('CREATE UNIQUE');
                            const indexDef: IndexDefinition = {
                                name: idx.indexname,
                                columns: cols,
                                unique: isUnique,
                            };
                            // Use semantic key based on uniqueness and columns
                            const key = `${isUnique ? 'unique' : 'index'}:${cols.sort().join(',')}`;
                            indexes[key] = indexDef;
                        }
                    }

                    tables[tableName] = {
                        name: tableName,
                        columns,
                        constraints: Object.keys(constraints).length ? constraints : undefined,
                        indexes: Object.keys(indexes).length ? indexes : undefined,
                    };
                }

                const res = await client.query('SELECT current_database()');

                return {
                    name: res.rows[0].current_database,
                    provider: 'postgres',
                    version: '1.0.0',
                    tables,
                };
            },
            actions: {
                'create-database': (action) => {
                    return `CREATE DATABASE "${action.name}";`
                },
                'create-table': (action) => {
                    const table = action.definition;
                    const columns = Object
                        .values(table.columns)
                        .map(column => `"${column.name}" ${DatabaseTranslator.mapColumnType('postgres', column)}${column.nullable ? '' : ' NOT NULL'}`);
                    const constraints = Object
                        .values(table.constraints ?? {})
                        .map(c => {
                            switch (c.type) {
                                case 'primary-key':
                                    return `PRIMARY KEY ("${(c as PrimaryKeyConstraintDefinition).column}")`;
                                case 'composite-primary-key':
                                    return `PRIMARY KEY (${(c as CompositePrimaryKeyConstraintDefinition).columns.map(col => `"${col}"`).join(', ')})`;
                                case 'unique':
                                    return `UNIQUE ("${(c as UniqueConstraintDefinition).column}")`;
                                default:
                                    return '';
                            }
                        })
                        .filter(Boolean);

                    const createTableSQL = `CREATE TABLE "${table.name}" (${[...columns, ...constraints].join(', ')});`;

                    // Create indexes after table creation (deferred for performance)
                    const indexes = table.indexes ?? {};
                    const createIndexSQL = Object.values(indexes).map(idx =>
                        `CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX "${idx.name}" ON "${table.name}" (${idx.columns.map(c => `"${c}"`).join(', ')});`
                    );

                    return [createTableSQL, ...createIndexSQL].join('\n');
                },
                'add-column': (action) => {
                    return `ALTER TABLE "${action.table}" ADD COLUMN "${action.definition.name}" ${DatabaseTranslator.mapColumnType('postgres', action.definition)}${action.definition.nullable ? '' : ' NOT NULL'};`;
                },
                'rename-table': (action) => {
                    return `ALTER TABLE "${action.from}" RENAME TO "${action.to}";`;
                },
                'rename-column': (action) => {
                    return `ALTER TABLE "${action.table}" RENAME COLUMN "${action.from}" TO "${action.to}";`;
                },
                'drop-table': (action) => {
                    if (action.policy?.strategy === 'archive' && action.policy.table) {
                        return `ALTER TABLE "${action.name}" RENAME TO "${action.policy.table}";`;
                    } else {
                        return `DROP TABLE "${action.name}";`;
                    }
                },
                'drop-column': (action) => {
                    return `ALTER TABLE "${action.table}" DROP COLUMN "${action.name}";`;
                },
                'recreate-table': (action) => {
                    const oldTable = action.oldTable;
                    const newTable = action.newTable;
                    const tempTableName = `${newTable.name}_new`;
                    const archiveTableName = action.policy?.table;

                    const queries: string[] = [];

                    // 1. Create new table with target schema (without indexes initially)
                    const columns = Object
                        .values(newTable.columns)
                        .map(column => `"${column.name}" ${DatabaseTranslator.mapColumnType('postgres', column)}${column.nullable ? '' : ' NOT NULL'}`);
                    const constraints = Object
                        .values(newTable.constraints ?? {})
                        .map(c => {
                            switch (c.type) {
                                case 'primary-key':
                                    return `PRIMARY KEY ("${(c as PrimaryKeyConstraintDefinition).column}")`;
                                case 'composite-primary-key':
                                    return `PRIMARY KEY (${(c as CompositePrimaryKeyConstraintDefinition).columns.map(col => `"${col}"`).join(', ')})`;
                                case 'unique':
                                    return `UNIQUE ("${(c as UniqueConstraintDefinition).column}")`;
                                default:
                                    return '';
                            }
                        })
                        .filter(Boolean);

                    queries.push(`CREATE TABLE "${tempTableName}" (${[...columns, ...constraints].join(', ')});`);

                    // 2. Copy data using bulk INSERT INTO ... SELECT
                    // Only copy columns that exist in both old and new tables
                    const commonColumns = Object.keys(newTable.columns).filter(colId => oldTable.columns[colId]);
                    if (commonColumns.length > 0) {
                        const columnNames = commonColumns.map(colId => `"${newTable.columns[colId].name}"`).join(', ');
                        queries.push(`INSERT INTO "${tempTableName}" (${columnNames}) SELECT ${columnNames} FROM "${oldTable.name}";`);
                    }

                    // 3. Create indexes on new table (deferred for performance)
                    const indexes = newTable.indexes ?? {};
                    for (const idx of Object.values(indexes)) {
                        queries.push(`CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX "${idx.name}" ON "${tempTableName}" (${idx.columns.map(c => `"${c}"`).join(', ')});`);
                    }

                    // 4. Drop or archive old table
                    if (archiveTableName) {
                        queries.push(`ALTER TABLE "${oldTable.name}" RENAME TO "${archiveTableName}";`);
                    } else {
                        queries.push(`DROP TABLE "${oldTable.name}";`);
                    }

                    // 5. Rename new table to original name
                    queries.push(`ALTER TABLE "${tempTableName}" RENAME TO "${newTable.name}";`);

                    return queries.join('\n');
                }
            }
        },
        sql: {
            name: 'sql',
            columnMappings: {
                string: {
                    type: SqlServerColumnType.nvarchar,
                    default: `''`
                },
                number: {
                    type: SqlServerColumnType.bigInt,
                    default: `0`
                },
                boolean: {
                    type: SqlServerColumnType.bit,
                    default: `0`
                },
                json: {
                    type: SqlServerColumnType.nvarcharMax,
                    default: `'null'`
                }
            },
            generateDefinition: async (connectionPool: mssql.ConnectionPool) => {
                // 1️⃣ Fetch tables
                const tablesRes = await connectionPool.request().query(`
                    SELECT TABLE_NAME
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = DB_NAME();
                `);

                const tables: Record<string, TableDefinition> = {};

                for (const row of tablesRes.recordset) {
                    const tableName = row.TABLE_NAME;

                    // 2️⃣ Fetch columns
                    const columnsRes = await connectionPool.request().query(`
                        SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = '${tableName}'
                        ORDER BY ORDINAL_POSITION;
                    `);

                    const columns: Record<string, ColumnDefinition> = {};
                    for (const col of columnsRes.recordset) {
                        let type: ColumnType;
                        let override: ColumnOverrideDefinition;
                        let pgOverride: ColumnOverrideDefinition;
                        switch (col.DATA_TYPE) {
                            case 'bigint':
                            case 'int':
                            case 'smallint':
                            case 'tinyint':
                            case 'numeric':
                            case 'decimal':
                            case 'float':
                            case 'real':
                                type = 'number';
                                break;
                            case 'bit':
                                type = 'boolean';
                                break;
                            case 'uniqueidentifier':
                                type = 'string';
                                override = { type: 'UNIQUEIDENTIFIER', default: 'NEWSEQUENTIALID()' };
                                pgOverride = { type: 'UUID', default: 'uuidv7()' };
                                break;
                            default:
                                type = 'string';
                                override = { type: `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH === -1 ? 'MAX' : col.CHARACTER_MAXIMUM_LENGTH})`, default: `''` };
                        }

                        columns[col.COLUMN_NAME] = {
                            name: col.COLUMN_NAME,
                            type,
                            nullable: col.IS_NULLABLE === 'YES',
                            ...(override ? { overrides: { postgres: pgOverride, sql: override } } : {})
                        };
                    }

                    // 3️⃣ Fetch constraints
                    const constraintsRes = await connectionPool.request().query(`
                        SELECT
                            tc.CONSTRAINT_NAME,
                            tc.CONSTRAINT_TYPE,
                            kcu.COLUMN_NAME
                        FROM
                            INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
                        LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
                        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                        WHERE tc.TABLE_NAME = '${tableName}' AND tc.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE');
                    `);

                    const constraints: Record<string, ConstraintDefinitions> = {};
                    for (const c of constraintsRes.recordset) {
                        if (c.CONSTRAINT_TYPE === 'PRIMARY KEY') {
                            const constraint: PrimaryKeyConstraintDefinition = { name: c.CONSTRAINT_NAME, type: 'primary-key', column: c.COLUMN_NAME };
                            constraints[`pk:${c.COLUMN_NAME}`] = constraint;
                        } else if (c.CONSTRAINT_TYPE === 'UNIQUE') {
                            const constraint: UniqueConstraintDefinition = { name: c.CONSTRAINT_NAME, type: 'unique', column: c.COLUMN_NAME };
                            constraints[`unique:${c.COLUMN_NAME}`] = constraint;
                        }
                    }

                    // 4️⃣ Fetch indexes (exclude primary key and unique constraint indexes)
                    const indexesRes = await connectionPool.request().query(`
                        SELECT
                            i.name as index_name,
                            i.is_unique,
                            STRING_AGG(c.name, ',') as columns
                        FROM
                            sys.indexes i
                        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                        INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                        WHERE
                            i.object_id = OBJECT_ID('${tableName}')
                            AND i.is_primary_key = 0
                            AND i.is_unique_constraint = 0
                        GROUP BY i.name, i.is_unique;
                    `);

                    const indexes: Record<string, IndexDefinition> = {};
                    for (const idx of indexesRes.recordset) {
                        const cols = idx.columns.split(',').map((s: string) => s.trim());
                        const indexDef: IndexDefinition = {
                            name: idx.index_name,
                            columns: cols,
                            unique: idx.is_unique
                        };
                        // Use semantic key based on uniqueness and columns
                        const key = `${idx.is_unique ? 'unique' : 'index'}:${cols.sort().join(',')}`;
                        indexes[key] = indexDef;
                    }

                    tables[tableName] = {
                        name: tableName,
                        columns,
                        constraints: Object.keys(constraints).length ? constraints : undefined,
                        indexes: Object.keys(indexes).length ? indexes : undefined,
                    };
                }

                const dbNameRes = await connectionPool.request().query('SELECT DB_NAME() as db_name');

                return {
                    name: dbNameRes.recordset[0].db_name,
                    provider: 'sql',
                    version: '1.0.0',
                    tables,
                };
            },
            actions: {
                'create-database': (action) => {
                    return `CREATE DATABASE [${action.name}];`
                },
                'create-table': (action) => {
                    const table = action.definition;
                    const columns = Object
                        .values(table.columns)
                        .map(column => `[${column.name}] ${DatabaseTranslator.mapColumnType('sql', column)}${column.nullable ? '' : ' NOT NULL'}`);
                    const constraints = Object
                        .values(table.constraints ?? {})
                        .map(c => {
                            switch (c.type) {
                                case 'primary-key':
                                    return `PRIMARY KEY ([${(c as PrimaryKeyConstraintDefinition).column}])`;
                                case 'composite-primary-key':
                                    return `PRIMARY KEY (${(c as CompositePrimaryKeyConstraintDefinition).columns.map(col => `[${col}]`).join(', ')})`;
                                case 'unique':
                                    return `UNIQUE ([${(c as UniqueConstraintDefinition).column}])`;
                                default:
                                    return '';
                            }
                        })
                        .filter(Boolean);

                    const createTableSQL = `CREATE TABLE [${table.name}] (${[...columns, ...constraints].join(', ')});`;

                    // Create indexes after table creation (deferred for performance)
                    const indexes = table.indexes ?? {};
                    const createIndexSQL = Object.values(indexes).map(idx =>
                        `CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX [${idx.name}] ON [${table.name}] (${idx.columns.map(c => `[${c}]`).join(', ')});`
                    );

                    return [createTableSQL, ...createIndexSQL].join('\n');
                },
                'add-column': (action) => {
                    return `ALTER TABLE [${action.table}] ADD [${action.definition.name}] ${DatabaseTranslator.mapColumnType('sql', action.definition)}${action.definition.nullable ? '' : ' NOT NULL'};`;
                },
                'rename-table': (action) => {
                    return `EXEC sp_rename '${action.from}', '${action.to}';`;
                },
                'rename-column': (action) => {
                    return `EXEC sp_rename '${action.table}.${action.from}', '${action.to}', 'COLUMN';`;
                },
                'drop-table': (action) => {
                    if (action.policy?.strategy === 'archive' && action.policy.table) {
                        return `EXEC sp_rename '${action.name}', '${action.policy.table}';`;
                    } else {
                        return `DROP TABLE [${action.name}];`;
                    }
                },
                'drop-column': (action) => {
                    return `ALTER TABLE [${action.table}] DROP COLUMN [${action.name}];`;
                },
                'recreate-table': (action) => {
                    const oldTable = action.oldTable;
                    const newTable = action.newTable;
                    const tempTableName = `${newTable.name}_new`;
                    const archiveTableName = action.policy?.table;

                    const queries: string[] = [];

                    // 1. Create new table with target schema (without indexes initially)
                    const columns = Object
                        .values(newTable.columns)
                        .map(column => `[${column.name}] ${DatabaseTranslator.mapColumnType('sql', column)}${column.nullable ? '' : ' NOT NULL'}`);
                    const constraints = Object
                        .values(newTable.constraints ?? {})
                        .map(c => {
                            switch (c.type) {
                                case 'primary-key':
                                    return `PRIMARY KEY ([${(c as PrimaryKeyConstraintDefinition).column}])`;
                                case 'composite-primary-key':
                                    return `PRIMARY KEY (${(c as CompositePrimaryKeyConstraintDefinition).columns.map(col => `[${col}]`).join(', ')})`;
                                case 'unique':
                                    return `UNIQUE ([${(c as UniqueConstraintDefinition).column}])`;
                                default:
                                    return '';
                            }
                        })
                        .filter(Boolean);

                    queries.push(`CREATE TABLE [${tempTableName}] (${[...columns, ...constraints].join(', ')});`);

                    // 2. Copy data using bulk INSERT INTO ... SELECT
                    // Only copy columns that exist in both old and new tables
                    const commonColumns = Object.keys(newTable.columns).filter(colId => oldTable.columns[colId]);
                    if (commonColumns.length > 0) {
                        const columnNames = commonColumns.map(colId => `[${newTable.columns[colId].name}]`).join(', ');
                        queries.push(`INSERT INTO [${tempTableName}] (${columnNames}) SELECT ${columnNames} FROM [${oldTable.name}];`);
                    }

                    // 3. Create indexes on new table (deferred for performance)
                    const indexes = newTable.indexes ?? {};
                    for (const idx of Object.values(indexes)) {
                        queries.push(`CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX [${idx.name}] ON [${tempTableName}] (${idx.columns.map(c => `[${c}]`).join(', ')});`);
                    }

                    // 4. Drop or archive old table
                    if (archiveTableName) {
                        queries.push(`EXEC sp_rename '${oldTable.name}', '${archiveTableName}';`);
                    } else {
                        queries.push(`DROP TABLE [${oldTable.name}];`);
                    }

                    // 5. Rename new table to original name
                    queries.push(`EXEC sp_rename '${tempTableName}', '${newTable.name}';`);

                    return queries.join('\n');
                }
            }
        }
    };

    public static mapColumnType(provider: DatabaseProviderName, column: ColumnDefinition | ColumnType) {
        if (typeof column === 'string') return this.providers[provider].columnMappings[column].type;
        if (column.overrides?.[provider]) return column.overrides[provider].type;
        return this.providers[provider].columnMappings[column.type].type;
    }

    public static getDefaultForColumnType(provider: DatabaseProviderName, column: ColumnDefinition | ColumnType) {
        if (typeof column === 'string') return this.providers[provider].columnMappings[column].default;
        if (column.overrides?.[provider]) return column.overrides[provider].default;
        return this.providers[provider].columnMappings[column.type].default;
    }

    public static getMigrationActionQuery(provider: DatabaseProviderName, action: MigrationActions) {
        const handler: (action: MigrationActions) => string = this.providers[provider].actions[action.type];
        return handler(action);
    }

    public static generateDefinition(provider: DatabaseProviderName, client) {
        return this.providers[provider].generateDefinition(client);
    }

}
