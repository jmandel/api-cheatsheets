Okay, I have analyzed the provided Hibernate documentation snippets. Here is the dense, self-contained cheatsheet optimized for an LLM agent.

## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of Hibernate ORM, focusing on core concepts, configuration, entity mapping, database interaction, querying (HQL, Criteria, Native SQL), advanced features, and integration points like Services and Registries. It is based entirely on the provided documentation snippets and aims to give you the necessary information to understand and start using Hibernate programmatically.

---

## Hibernate ORM Cheatsheet

### Core Concepts

*   **Object/Relational Mapping (ORM):** Technique for mapping data from an object model representation (Java classes) to a relational data model representation (database tables) and vice versa.
*   **Entity:** A Java class representing data in a relational database table. Must be a non-final class with a non-private, no-argument constructor. Annotated with `@jakarta.persistence.Entity`.
*   **Attribute:** Properties or fields of an entity that map to table columns.
*   **Identifier (`@Id`):** A mandatory attribute (or combination of attributes) mapping to the primary key of the table, representing the persistent identity of an entity.
*   **Persistence Context (First-Level Cache):** A transactional cache associated with a `Session` or `EntityManager`. Manages entity states (`transient`, `managed`/`persistent`, `detached`, `removed`) and ensures identity uniqueness within its scope. *Not thread-safe*.
*   **SessionFactory (`org.hibernate.SessionFactory`):** Thread-safe factory for `Session` instances. Represents the mapped domain model. Expensive to create; typically one per database. Extends `jakarta.persistence.EntityManagerFactory`.
*   **Session (`org.hibernate.Session`):** Single-threaded, short-lived object representing a unit of work and interaction with the database. Wraps a JDBC `Connection`. Manages the persistence context. Extends `jakarta.persistence.EntityManager`. *Must not be shared between threads/transactions*.
*   **StatelessSession (`org.hibernate.StatelessSession`):** Alternative, command-oriented API without a persistence context (no first-level cache, no automatic dirty checking). Operations are executed immediately. Entities are always detached. Useful for bulk operations. Does not cascade operations or support transparent lazy loading (requires explicit `fetch()`).
*   **Transaction (`org.hibernate.Transaction`):** API for abstracting physical transaction demarcation (JDBC or JTA). Obtained from `Session`. Methods: `begin()`, `commit()`, `rollback()`, `markRollbackOnly()`, `setTimeout()`, `registerSynchronization()`, `getStatus()`.

### Configuration & Bootstrap

**Ways to Bootstrap:**

1.  **JPA XML (`persistence.xml`):** Standard JPA approach, placed in `META-INF/`. Defines `<persistence-unit>`. Obtain `EntityManagerFactory` via `Persistence.createEntityManagerFactory("unit-name", propertiesMap?)`.
2.  **Programmatic JPA (`PersistenceConfiguration`):** Type-safe programmatic configuration. Use `new PersistenceConfiguration("unit-name").managedClass(...).property(...).createEntityManagerFactory()`. Hibernate offers `HibernatePersistenceConfiguration` for convenience.
3.  **Hibernate Native (`hibernate.properties` / `hibernate.cfg.xml`):** Properties file in root classpath or XML configuration.
4.  **Hibernate Native (`Configuration` class):** Simple API: `new Configuration().addResource(...).addAnnotatedClass(...).setProperty(...).buildSessionFactory()`.
5.  **Hibernate Native (Builder-style):** Advanced API via `BootstrapServiceRegistryBuilder`, `StandardServiceRegistryBuilder`, `MetadataSources`, `MetadataBuilder`, `SessionFactoryBuilder`. Used internally and by framework integrators.
6.  **Container:** Managed by environments like WildFly, Quarkus (often via injection `@PersistenceContext`, `@Inject`).

**Key Configuration Properties (`jakarta.persistence.*` or `hibernate.*` namespaces):**

*   **JDBC Connection:**
    *   `jakarta.persistence.jdbc.url`: JDBC URL.
    *   `jakarta.persistence.jdbc.user`: DB username.
    *   `jakarta.persistence.jdbc.password`: DB password.
    *   `hibernate.connection.driver_class` / `jakarta.persistence.jdbc.driver`: JDBC driver class (often auto-detected).
    *   `hibernate.dialect`: SQL Dialect class (auto-detected since Hibernate 6, usually not needed).
    *   `hibernate.connection.pool_size`: Size for built-in pool (not for production). Use dedicated providers like Agroal, HikariCP, C3P0 via `hibernate.connection.provider_class`.
    *   `hibernate.connection.provider_class`: Specify connection pool implementation (e.g., `agroal`, `hikaricp`, `c3p0`).
    *   `hibernate.connection.datasource`: JNDI name or `DataSource` instance reference.
    *   `jakarta.persistence.jtaDataSource` / `jakarta.persistence.nonJtaDataSource`: JNDI names in container environments.
*   **Schema Generation (`hibernate.hbm2ddl.auto` or `jakarta.persistence.schema-generation.database.action`):**
    *   `create`: Export schema on startup.
    *   `drop-and-create`: Drop existing schema, then export.
    *   `create-drop`: Drop schema, export on startup, drop on shutdown.
    *   `update`: Attempt to update existing schema (use with caution, *not for production*).
    *   `validate`: Validate existing schema against mappings.
    *   `none`: Do nothing.
*   **Schema Import/Management:**
    *   `jakarta.persistence.sql-load-script-source`: Path to SQL DML script executed after schema export (e.g., `import.sql`).
    *   `jakarta.persistence.schema-generation.create-script-source`: Path to SQL DDL script executed during schema export.
    *   `jakarta.persistence.create-database-schemas`: (Optional) If `true`, create schemas/catalogs if needed.
*   **SQL Logging:**
    *   `hibernate.show_sql`: (boolean) Log SQL to console.
    *   `hibernate.format_sql`: (boolean) Pretty-print logged SQL.
    *   `hibernate.highlight_sql`: (boolean) Syntax-highlight logged SQL (ANSI).
    *   Alternatively, use SLF4J logging categories (e.g., `org.hibernate.SQL=debug`, `org.hibernate.orm.jdbc.bind=trace`).
*   **Mapping Defaults:**
    *   `hibernate.default_schema`: Default schema name if not specified in `@Table`.
    *   `hibernate.default_catalog`: Default catalog name if not specified in `@Table`.
    *   `hibernate.physical_naming_strategy`: `PhysicalNamingStrategy` implementation class name.
    *   `hibernate.implicit_naming_strategy`: `ImplicitNamingStrategy` implementation class name or short name (`jpa`, `default`, `legacy-hbm`, `legacy-jpa`, `component-path`).
*   **Identifier Quoting:**
    *   `hibernate.globally_quoted_identifiers`: (boolean) Quote all identifiers. (Not recommended).
    *   `hibernate.auto_quote_keyword`: (boolean) Quote identifiers that are SQL keywords.
*   **Date/Time Handling:**
    *   `hibernate.jdbc.time_zone`: Specify explicit time zone for JDBC interaction if different from JVM default.
    *   `hibernate.type.java_time_use_direct_jdbc`: (boolean, experimental) Use `getObject`/`setObject` for `java.time` types directly.
*   **Nationalized Characters (SQL Server):**
    *   `hibernate.use_nationalized_character_data`: (boolean) Use `nchar`/`nvarchar` instead of `char`/`varchar` globally. Use `@Nationalized` for specific columns otherwise.
*   **JTA Platform:**
    *   `hibernate.transaction.jta.platform`: Short name (`JBossAS`, `Atomikos`, etc.) or class name of `JtaPlatform` implementation.
*   **Bytecode Enhancement (Runtime):**
    *   `hibernate.enhancer.enableDirtyTracking`: (boolean, deprecated) Enable interception-based change detection.
    *   `hibernate.enhancer.enableLazyInitialization`: (boolean, deprecated) Enable attribute-level lazy loading.
    *   `hibernate.enhancer.enableAssociationManagement`: (boolean) Enable automatic bidirectional association management.
*   **Statistics:**
    *   `hibernate.generate_statistics`: (boolean) Enable statistics collection.

### Mapping Entities

*   **`@Entity`**: Marks a class as an entity.
    *   `name`: (Optional) JPQL entity name (defaults to unqualified class name).
*   **`@Table`**: Specifies the primary table for an entity.
    *   `name`: Table name.
    *   `schema`, `catalog`: (Optional) Schema/catalog name (prefer `hibernate.default_schema`/`catalog` property).
    *   `uniqueConstraints`: Array of `@UniqueConstraint`.
    *   `indexes`: Array of `@Index`.
*   **`@SecondaryTable`**: Maps attributes to a secondary table joined by primary key.
    *   Attributes: `name`, `schema`, `catalog`, `pkJoinColumns` (`@PrimaryKeyJoinColumn`), `uniqueConstraints`, `indexes`.
*   **`@MappedSuperclass`**: Defines common mappings for subclasses, but is not an entity itself. Subclasses inherit mappings.
*   **`@Id`**: Marks the simple identifier property/field.
*   **`@GeneratedValue`**: Specifies identifier generation strategy.
    *   `strategy`: `GenerationType` (`AUTO`, `IDENTITY`, `SEQUENCE`, `TABLE`, `UUID`).
    *   `generator`: Name of a defined generator (`@SequenceGenerator`, `@TableGenerator`, `@GenericGenerator`).
*   **`@SequenceGenerator`**: Defines a sequence-based ID generator.
    *   `name`: Logical name of the generator.
    *   `sequenceName`: Database sequence name.
    *   `allocationSize`: Number of IDs to fetch from sequence at once (optimization).
    *   `initialValue`: Start value.
*   **`@TableGenerator`**: Defines a table-based ID generator.
*   **`@EmbeddedId`**: Marks a composite identifier property/field whose type is an `@Embeddable`. Preferred way for composite IDs.
*   **`@IdClass`**: Specifies a separate class to represent a composite identifier when multiple `@Id` annotations are used on the entity. Id class fields must match entity `@Id` fields. Requires `equals()`/`hashCode()`.
*   **`@Embeddable`**: Marks a class whose instances are stored as an intrinsic part of an owning entity (no persistent identity of its own). Attributes map to columns of the owner's table by default.
*   **`@Embedded`**: (Optional) Marks an attribute whose type is an `@Embeddable`.
*   **`@AttributeOverride` / `@AssociationOverride`**: Used on an `@Embedded` attribute to override column/join column mappings defined in the `@Embeddable` class. Necessary when embedding the same type multiple times.
*   **`@Version`**: Marks an attribute used for optimistic locking. Type typically `int`, `short`, `long`, `Timestamp`, `LocalDateTime`, `Instant`, etc. Automatically managed by Hibernate.
*   **`@Basic`**: (Optional) Marks a basic-typed attribute.
    *   `optional`: (boolean, default `true`) Hint if `null` is allowed.
    *   `fetch`: (`FetchType.EAGER` (default) / `FetchType.LAZY`) Specifies fetching strategy. Lazy requires bytecode enhancement.
*   **`@Column`**: Specifies mapping for a basic attribute's column.
    *   `name`: Column name.
    *   `table`: Name of the table (if using `@SecondaryTable`).
    *   `length`, `precision`, `scale`: Column definition details.
    *   `unique`, `nullable`: Constraint definitions.
    *   `insertable`, `updatable`: (boolean) Controls inclusion in generated SQL INSERT/UPDATE.
*   **`@Enumerated`**: Specifies how an `enum` is persisted.
    *   `EnumType.ORDINAL` (default): Persist by `enum.ordinal()`.
    *   `EnumType.STRING`: Persist by `enum.name()`. (Generally preferred).
*   **`@Convert`**: Applies a custom `jakarta.persistence.AttributeConverter` to an attribute.
    *   `converter`: The `AttributeConverter` class.
    *   `disableConversion`: (boolean) Temporarily disable the converter.
*   **`@Converter`**: Registers an `AttributeConverter`.
    *   `autoApply`: (boolean) If `true`, automatically applies to all attributes of the target type.
*   **`@Lob`**: Specifies mapping as a LOB type (BLOB/CLOB). Often unnecessary; prefer large `@Column(length=...)` which allows Hibernate to choose appropriate type (`TEXT`, `CLOB`, `VARCHAR(max)`, etc.). Can interfere with some drivers (e.g., PostgreSQL `TEXT`/`BYTEA`).
*   **`@Temporal`**: (Deprecated) Used with `java.util.Date`/`Calendar` to specify `TemporalType` (`DATE`, `TIME`, `TIMESTAMP`). Prefer `java.time` types.
*   **`@Nationalized`**: (Hibernate specific) Marks a `String`/`char[]`/`Clob`/`NClob` attribute to use nationalized variants (`NVARCHAR`, `NCLOB`, etc.). See also `hibernate.use_nationalized_character_data`.
*   **`@Formula`**: (Hibernate specific) Maps a read-only attribute to a native SQL formula/expression evaluated when the entity is loaded.
*   **`@Generated`**: (Hibernate specific) Marks an attribute whose value is generated by the database (e.g., via trigger, default clause). Tells Hibernate to refresh the entity after insert/update.
    *   `value` / `timing`: `GenerationTime.NEVER` (default), `INSERT`, `ALWAYS`.
*   **`@Check`**: (Hibernate specific) Adds a SQL CHECK constraint to the table DDL.
*   **`@SQLRestriction`**: (Hibernate specific) Adds a permanent SQL WHERE clause fragment used whenever the entity (or collection) is fetched.
*   **`@Where`**: (Hibernate specific, deprecated) Older version of `@SQLRestriction`.
*   **`@FilterDef` / `@Filter`**: (Hibernate specific) Defines named, parameterized filters that can be enabled per-session to add SQL restrictions dynamically. `@FilterDef` defines the filter name and parameters (`@ParamDef`). `@Filter` applies it to an entity or collection, optionally overriding the `condition`.
*   **`@SoftDelete`**: (Hibernate specific) Enables soft-delete for an entity or collection table. Deleted rows are marked via a column update instead of physical deletion.
    *   `columnName`: Name of the indicator column (defaults depend on strategy).
    *   `strategy`: `SoftDeleteType.DELETED` (default) or `ACTIVE`.
    *   `converter`: An `AttributeConverter<Boolean, ?>` for the indicator value (e.g., `NumericBooleanConverter`, `YesNoConverter`, `TrueFalseConverter`).
*   **`@SQLInsert`, `@SQLUpdate`, `@SQLDelete`, `@SQLDeleteAll`, `@SQLSelect`**: (Hibernate specific) Override generated CRUD SQL statements with custom native SQL or stored procedure calls. Use `callable=true` for stored procedures.
*   **`@DynamicInsert`, `@DynamicUpdate`**: (Hibernate specific) Generate INSERT/UPDATE SQL dynamically at runtime to include only non-null (for insert) or modified (for update) columns. `@DynamicUpdate` can have subtle effects without a `@Version` property.
*   **`@OptimisticLocking`**: (Hibernate specific) Controls versionless optimistic locking strategy (`OptimisticLockType.VERSION` (default), `ALL`, `DIRTY`, `NONE`).
*   **`@OptimisticLock`**: (Hibernate specific) Exclude specific attributes from optimistic locking checks (`excluded=true`).

**Associations:**

*   **`@ManyToOne`**: Maps a many-to-one association (typically via foreign key).
    *   `fetch`: `FetchType.EAGER` (default, *often bad*), `FetchType.LAZY`.
    *   `cascade`: Array of `CascadeType` (`PERSIST`, `MERGE`, `REMOVE`, `REFRESH`, `DETACH`, `ALL`).
    *   `optional`: (boolean, default `true`) If `false`, implies associated FK column is `NOT NULL`.
*   **`@OneToMany`**: Maps a one-to-many association. Usually the inverse side of `@ManyToOne`.
    *   `mappedBy`: Name of the owning-side attribute in the target entity (makes this the inverse side). *Required* for bidirectional.
    *   `fetch`: `FetchType.LAZY` (default), `FetchType.EAGER`.
    *   `cascade`: Array of `CascadeType`.
    *   `orphanRemoval`: (boolean, default `false`) If `true`, removing a child from the collection also deletes the child entity.
*   **`@OneToOne`**: Maps a one-to-one association.
    *   Can be owning side (with FK in its table) or inverse side (`mappedBy`).
    *   Attributes similar to `@ManyToOne`/`@OneToMany`.
    *   `mapsId`: Used on the "child" side when sharing the primary key with the "parent" association. The `@Id` on the child should not be `@GeneratedValue`.
*   **`@ManyToMany`**: Maps a many-to-many association (requires a join/link table).
    *   Can be owning or inverse (`mappedBy`) side.
    *   Attributes similar to `@OneToMany`.
*   **`@JoinColumn`**: Specifies the foreign key column for `@ManyToOne` or `@OneToOne` (owning side), or in `@JoinTable`.
    *   `name`: FK column name.
    *   `referencedColumnName`: PK column name in the target table (defaults to target's ID column).
    *   `unique`, `nullable`, `insertable`, `updatable`.
    *   `foreignKey`: (`@ForeignKey`) Defines DDL FK constraint details (name, definition).
*   **`@JoinTable`**: Specifies the link table for `@ManyToMany` or unidirectional `@OneToMany`.
    *   `name`: Link table name.
    *   `joinColumns`: Array of `@JoinColumn` for the FK to the owning entity's table.
    *   `inverseJoinColumns`: Array of `@JoinColumn` for the FK to the target entity's table.
    *   `uniqueConstraints`, `indexes`.
*   **`@OrderBy`**: (JPA) Specifies ordering of a collection based on *attributes* of the target entity (JPQL fragment). Applied when collection is retrieved.
*   **`@OrderColumn`**: Specifies a dedicated column in the collection/link table to persist the order of a `List`.
    *   `name`: Order column name.
*   **`@MapKey`**: Specifies an *attribute* of the target entity to use as the key in a `Map` association.
*   **`@MapKeyColumn`**: Specifies a column in the collection/link table to persist the key of a `Map` whose keys are of basic type.
*   **`@MapKeyJoinColumn`**: Specifies FK column(s) in the collection/link table to persist the key of a `Map` whose keys are entities.
*   **`@ElementCollection`**: Maps a collection of basic or embeddable types (stored in a separate collection table).
    *   `targetClass`: (Optional) Class of the elements if generics aren't used.
    *   `fetch`: `FetchType.LAZY` (default), `FetchType.EAGER`.
*   **`@CollectionTable`**: Specifies the table for an `@ElementCollection`.
    *   `name`: Collection table name.
    *   `joinColumns`: FK columns back to the owning entity's table.
*   **`@AttributeOverride`**: Used within `@ElementCollection` to override column mappings for an embeddable element type.
*   **`@Any` / `@ManyToAny`**: (Hibernate specific) Maps a polymorphic association where targets don't share a common mapped superclass. Requires a discriminator column and a foreign key column. `@ManyToAny` uses a join table. Use with caution. Associated annotations: `@AnyDiscriminator`, `@AnyDiscriminatorValue`, `@AnyKeyJavaClass`, `@AnyKeyJdbcType`, etc.

**Inheritance Mapping:**

*   **`@Inheritance`**: Specified on root entity.
    *   `strategy`: `InheritanceType.SINGLE_TABLE` (default), `JOINED`, `TABLE_PER_CLASS`.
*   **`@DiscriminatorColumn`**: Specifies the discriminator column for `SINGLE_TABLE` or `JOINED` (optional for joined).
    *   `name`: Column name (default `DTYPE`).
    *   `discriminatorType`: `DiscriminatorType.STRING` (default), `CHAR`, `INTEGER`.
*   **`@DiscriminatorValue`**: Specifies the value identifying a specific subclass in the discriminator column.
*   **`@PrimaryKeyJoinColumn`**: Used with `JOINED` strategy on subclasses to specify the PK/FK column joining to the base table.

### Interacting with Data

*   **Obtaining Session/EntityManager:**
    *   From `SessionFactory`/`EntityManagerFactory`: `openSession()`, `createEntityManager()`. *Remember to close them*.
    *   Via helper methods: `sessionFactory.inTransaction(session -> ...)` or `sessionFactory.inSession(session -> ...)` (Hibernate specific).
    *   Via injection in containers: `@PersistenceContext`, `@Inject`.
*   **Transactions:**
    *   JPA: `entityManager.getTransaction()` returns `EntityTransaction` (`begin`, `commit`, `rollback`, `isActive`, `getRollbackOnly`, `setRollbackOnly`).
    *   Hibernate: `session.beginTransaction()` returns `Transaction`.
    *   Helper: `entityManagerFactory.runInTransaction(...)` / `sessionFactory.inTransaction(...)`.
*   **Persistence Operations (`EntityManager` / `Session`):**
    *   `persist(entity)`: Makes a transient entity managed and schedules an INSERT.
    *   `remove(entity)` / `delete(entity)`: Makes a managed or detached (Hibernate only) entity removed and schedules a DELETE.
    *   `merge(entity)`: Copies state from detached entity to a managed instance (fetched or new), returns the managed instance.
    *   `find(Class, id)` / `session.get(Class, id)`: Retrieves an entity by ID, returning `null` if not found. Hits DB if not in context.
    *   `getReference(Class, id)` / `session.load(Class, id)`: Returns a proxy/reference without hitting DB (unless already managed). Throws exception later if entity doesn't exist. Useful for setting associations.
    *   `refresh(entity)`: Reloads entity state from the database, overwriting changes in context.
    *   `detach(entity)` / `session.evict(entity)`: Removes entity from the context. Changes won't be persisted.
    *   `clear()`: Removes all entities from the context.
    *   `contains(entity)`: Checks if entity is currently managed.
    *   `flush()`: Synchronizes the persistence context state with the database (executes queued SQL).
*   **Flushing:**
    *   Occurs automatically before transaction commit, sometimes before queries (if query overlaps with unflushed changes - `FlushModeType.AUTO`), or manually via `flush()`.
    *   `setFlushMode(FlushModeType)` / `session.setHibernateFlushMode(FlushMode)`: Control flush behavior (`AUTO`, `COMMIT`, `MANUAL` (Hibernate), `ALWAYS` (Hibernate)).
*   **Cascading:** Propagate operations (PERSIST, MERGE, REMOVE, REFRESH, DETACH, ALL) from parent to associated child entities via `cascade` attribute on association annotations (e.g., `@OneToMany(cascade=CascadeType.ALL)`). `orphanRemoval=true` on `@OneToMany`/`@OneToOne` deletes child when removed from collection/association.
*   **Lazy Loading & Proxies:**
    *   Unfetched LAZY associations are represented by proxies. Accessing proxy methods (except `getId()`) triggers initialization (DB hit).
    *   `LazyInitializationException` if accessed outside an active persistence context.
    *   Check initialization: `PersistenceUnitUtil.isLoaded(proxy)` or `Hibernate.isInitialized(proxy)`.
    *   Initialize manually: `PersistenceUnitUtil.load(proxy)` or `Hibernate.initialize(proxy)`. (Generally inefficient, prefer eager fetching).
*   **Eager Fetching:** Avoid N+1 selects by fetching needed associations upfront.
    *   **`join fetch` (HQL/JPQL):** `select b from Book b left join fetch b.authors`.
    *   **Criteria API:** `Root<Book> book = ...; book.fetch(Book_.authors);`
    *   **Entity Graphs (JPA):** Programmatic or named (`@NamedEntityGraph`) definition of paths to fetch. Pass graph to `find()` or use as query hint (`jakarta.persistence.fetchgraph` / `loadgraph`).
    *   **Fetch Profiles (Hibernate):** Named profiles (`@FetchProfile`) activated per-session (`session.enableFetchProfile(...)`). Overrides specified via `@FetchProfileOverride` on associations. Allows `FetchMode.SUBSELECT`.

### Querying

*   **HQL/JPQL:** Object-oriented query language similar to SQL but operates on entities and attributes.
    *   Obtain query: `entityManager.createQuery(jpqlString, ResultClass.class)` or `session.createSelectionQuery(hqlString, ResultClass.class)`.
    *   Parameters: Named (`:name`) or ordinal (`?1`). Bind using `setParameter()`.
    *   Execution: `getResultList()`, `getSingleResult()`, `getSingleResultOrNull()`.
    *   Mutations (`UPDATE`, `DELETE`, `INSERT` (HQL only)): Use `executeUpdate()`.
*   **Criteria API:** Programmatic, type-safe query construction.
    *   Get builder: `entityManagerFactory.getCriteriaBuilder()` (returns `CriteriaBuilder`) or `sessionFactory.getCriteriaBuilder()` (returns `HibernateCriteriaBuilder`).
    *   Create query: `builder.createQuery(ResultClass.class)`.
    *   Define roots: `query.from(Entity.class)`.
    *   Build predicates: `builder.equal()`, `builder.like()`, `builder.and()`, etc.
    *   Set clauses: `query.select()`, `query.where()`, `query.orderBy()`, `query.groupBy()`.
    *   Execute: `entityManager.createQuery(criteriaQuery).getResultList()`.
*   **Native SQL:** Execute raw SQL.
    *   Obtain query: `entityManager.createNativeQuery(sqlString)` or `session.createNativeQuery(sqlString, ResultClass.class)`.
    *   Mapping results:
        *   Scalar: Returns `Object[]` by default. Use `addScalar()` (Hibernate) for explicit types.
        *   Entity: Pass entity class to `createNativeQuery`. Use `{alias.*}` and `{alias.property}` placeholders for column aliases. Define mappings via `@SqlResultSetMapping` for complex cases.
        *   DTO: Use `SqlResultSetMapping` with `@ConstructorResult` (JPA) or `setResultTransformer(Transformers.aliasToBean(DTO.class))` (Hibernate).
    *   Synchronization: Add `addSynchronizedEntityClass()` (Hibernate) or `addSynchronizedQuerySpace()` to notify Hibernate which entity tables affect the query results, enabling auto-flush.
*   **Named Queries:** Defined via `@NamedQuery` (JPQL/HQL) or `@NamedNativeQuery` (SQL) on an entity or in XML. Executed via `createNamedQuery()`. Checked at startup.
*   **Pagination:**
    *   `query.setFirstResult(offset).setMaxResults(limit)`
    *   HQL: `... limit ? offset ?` or `... fetch first ? rows only` / `... offset ? rows fetch next ? rows only`.
*   **Projections:** Queries returning non-entities.
    *   `Object[]` (default).
    *   `Tuple` (JPA Criteria or `createQuery(..., Tuple.class)`). Requires aliases.
    *   DTO/Record class (pass class to `createQuery`/`createSelectionQuery`). Constructor must match select list.
    *   `select new ...(...)` HQL syntax.
    *   `Map` or `List` (Hibernate specific, pass class to `createQuery`).

### Services and Registries (Integration Guide)

*   **Service:** Interface defining specific functionality (e.g., `ConnectionProvider`), implemented by various classes. Consumers program to the role (interface).
    *   Marker interface: `org.hibernate.service.Service`.
    *   Optional lifecycle interfaces: `Startable`, `Stoppable`, `ServiceRegistryAwareService`.
    *   Dependencies: Declared via `@InjectService` annotation on methods or by implementing `ServiceRegistryAwareService` and using the injected `ServiceRegistry`.
*   **ServiceRegistry:** Hosts and manages `Service` lifecycles and dependencies (IoC container). Hierarchical.
    *   Interface: `org.hibernate.service.ServiceRegistry`.
*   **ServiceBinding:** Associates a `Service` with a `ServiceRegistry`. Created via `Service` instance or `ServiceInitiator`.
*   **Hibernate Registry Hierarchy:**
    1.  **`BootstrapServiceRegistry`:** Root registry, built via `BootstrapServiceRegistryBuilder`. Holds essential services:
        *   `ClassLoaderService`: Interacts with `ClassLoaders`.
        *   `IntegratorService`: Manages `org.hibernate.integrator.spi.Integrator` instances (discovered via `ServiceLoader` or registered manually).
        *   `StrategySelector`: Manages short names for strategy implementations (e.g., "jdbc" for `JdbcTransactionFactory`).
    2.  **`StandardServiceRegistry`:** Main registry, parent is `BootstrapServiceRegistry`. Built via `StandardServiceRegistryBuilder`. Holds most standard Hibernate services (e.g., `ConnectionProvider`, `JdbcServices`, `TransactionCoordinatorBuilder`, `JtaPlatform`, `RegionFactory`). Services can be overridden or extended here via the builder or `ServiceContributor` SPI (using `ServiceLoader`).
    3.  **`SessionFactoryServiceRegistry`:** Child of `StandardServiceRegistry`. Holds services needing access to `SessionFactory`. Built via `SessionFactoryServiceRegistryFactory` service. Key services:
        *   `EventListenerRegistry`: Manages Hibernate event listeners. Integrators often modify this.
        *   `StatisticsImplementor`: Statistics SPI.
*   **Custom Services:**
    *   **Overriding:** Provide a new implementation for a standard service role. Register via `StandardServiceRegistryBuilder.addService()` or `addInitiator()`, or use a `ServiceContributor` with `ServiceLoader` (`META-INF/services/org.hibernate.service.spi.ServiceContributor`). Can register short names via `StrategySelector`.
    *   **Extending:** Define a new service role (interface) and implementation(s). Register via `StandardServiceRegistryBuilder.addInitiator()` or through a `ServiceContributor`.

### Hibernate Query Language (HQL) Details

*   **Case Sensitivity:** Keywords/functions are case-insensitive. Entity names, attribute names, identification variables are case-sensitive (except identification variables in strict JPQL compliance mode).
*   **Literals:**
    *   String: `'string'`, escape single quote with `''`.
    *   Numeric: `1`, `1.0`, `1L`, `1.0F`, `1.0BD`, `1BI`, `0xCAFE`.
    *   Boolean: `true`, `false`.
    *   Date/Time: `{d 'yyyy-mm-dd'}`, `{t 'hh:mm:ss'}`, `{ts 'yyyy-mm-dd hh:mm:ss.ms'}` (JDBC escape); `{yyyy-mm-dd}`, `{hh:mm:ss}`, `{yyyy-mm-dd hh:mm:ss}` (braced); `date yyyy-mm-dd`, `time hh:mm:ss`, `datetime yyyy-mm-dd hh:mm:ss.ms` (typed). Current: `local date`, `local time`, `local datetime`, `offset datetime`, `instant` (preferred); `current_date`, `current_time`, `current_timestamp` (legacy).
    *   Duration: `n unit` (e.g., `1 day`, `10 year`, `100 nanosecond`).
    *   Enum: Unqualified name (e.g., `STATUS = MY_ENUM_VALUE`).
    *   Java Constant: Fully qualified name (e.g., `java.lang.Math.PI`).
    *   Entity Name: Unqualified name (e.g., `type(p) = CreditCardPayment`).
*   **Path Expressions:** `alias.attribute.nestedAttribute`. Implicit joins generated for associations. Use `element()`, `key()`, `value()`, `index()` for collection navigation.
*   **Operators:** Standard arithmetic (`+`, `-`, `*`, `/`, `%`), string concatenation (`||`), comparisons (`=`, `<>`, `<`, `>`, `<=`, `>=`), logical (`and`, `or`, `not`), `is null`, `is not null`, `is distinct from`, `is not distinct from`, `between`, `not between`, `like`, `ilike`, `not like`, `not ilike` (use `%`, `_`, `escape`), `in`, `not in`, `is empty`, `is not empty`, `member of`, `not member of`, `exists`.
*   **Functions:**
    *   Type: `type(e)`, `treat(e as Type)`, `cast(x as Type)`, `str(x)`, `ordinal(x)`.
    *   Null: `coalesce(x, y, ...)` / `ifnull(x, y)`, `nullif(x, y)`.
    *   Datetime: `extract(field from dt)`, `format(dt as pattern)`, `truncate(dt, field)`, `year()`, `month()`, `day()`, etc.
    *   String: `upper()`, `lower()`, `length()`, `concat()`, `locate()`, `position()`, `substring()`, `trim()`, `overlay()`, `pad()`, `left()`, `right()`, `replace()`, `repeat()`, `collate()`.
    *   Numeric: `abs()`, `sign()`, `mod()`, `sqrt()`, `exp()`, `power()`, `ln()`, `round()`, `trunc()`, `floor()`, `ceiling()`, `log10()`, `log()`, `pi`, trig functions, `least()`, `greatest()`, bitwise functions.
    *   Collection: `size()`, `element()`, `index()`, `key()`, `value()`, `entry()`. For subqueries/quantification: `elements()`, `indices()`.
    *   Model: `id()`, `version()`, `naturalid()`, `fk()`.
    *   Array: `array()`, `array_agg()`, `array_position()`, `array_contains()`, etc.
    *   JSON: `json_object()`, `json_array()`, `json_value()`, `json_exists()`, etc. (Requires `hibernate.query.hql.json_functions_enabled=true`).
    *   XML: `xmlelement()`, `xmlcomment()`, `xmlforest()`, etc. (Requires `hibernate.query.hql.xml_functions_enabled=true`).
    *   Native SQL: `function('name', args...)`, `sql('native snippet ?', arg)`.
*   **Clauses:**
    *   `select [distinct] ...`: Projection. Use `select new ...` for DTOs/Records.
    *   `from Entity [as alias], ...`: Declares root entities. Can use `cross join`. Supports derived roots (subqueries in `from`).
    *   `[type] join [fetch] alias.association [as assocAlias] [on|with condition]`: Explicit joins. `fetch` forces eager loading. `on`/`with` adds conditions. Supports `lateral` joins (correlated subqueries).
    *   `where predicate`: Filters rows before grouping.
    *   `group by expression, ...`: Groups rows for aggregation. Supports `rollup()`, `cube()`.
    *   `having predicate`: Filters groups after aggregation.
    *   `order by expression [asc|desc] [nulls first|last], ...`: Sorts results.
    *   `limit n [offset m]`: Limits/paginates results (alternative to API methods).
    *   `union | intersect | except [all]`: Set operations between queries.
    *   `with cteName as (...) ...`: Common Table Expressions, supports `materialized` hints and recursive queries (`union all`, `search`, `cycle`).

### Compile-time Tooling (Hibernate Processor)

*   **Purpose:** Annotation processor (`org.hibernate.orm:hibernate-processor`) generating code for improved type safety.
*   **Static Metamodel:** Generates classes like `Book_` for each entity `Book`. Contains `static volatile` attributes (e.g., `SingularAttribute<Book, String> title`) and `String` constants (e.g., `public static final String TITLE = "title"`) representing entity fields. Used in Criteria API, Entity Graphs, etc.
*   **Generated Query/Finder Methods (Extension):**
    *   Annotate methods in an interface (or abstract class) with `@HQL`, `@SQL`, or `@Find`.
    *   Processor generates implementation (often in a `_`-suffixed class).
    *   **`@HQL`/`@SQL`:** Provide query string. Method signature validated against query parameters at compile time.
    *   **`@Find`:** Query inferred from method signature (parameter names/types must match entity fields exactly). Use `@By("fieldName")` to map parameter names. Use `@Pattern` for `like`. Use `Range<T>` for range conditions.
    *   Method can return entity, `List<Entity>`, `Optional<Entity>`, `Object[]`, `Tuple`, DTO/Record, `Stream`, `SelectionQuery`, `int`/`void` (for mutations).
    *   Can accept special parameters: `PageRequest`, `Sort`, `Order`, `Restriction` (Hibernate native) for dynamic pagination, sorting, filtering.
    *   Can be static methods (requiring `Session`/`EntityManager` as first arg) or instance methods (if repository interface declares a session accessor method like `Session session();`).
    *   Can generate CDI-injectable beans if `jakarta.inject`/`jakarta.enterprise.context` are present.

### Performance & Tuning

*   **Connection Pooling:** Use production-ready pools (Agroal, HikariCP, C3P0) via `hibernate.connection.provider_class`. Configure pool size (`hibernate.agroal.maxSize`, etc.). Avoid built-in pool in production.
*   **JDBC Fetch Size:** Control rows fetched per DB round trip (`hibernate.jdbc.fetch_size`). Important for some drivers (e.g., Oracle defaults to 10).
*   **Statement Batching:** Enable JDBC batching for INSERT/UPDATE/DELETE via `hibernate.jdbc.batch_size` (e.g., 20-50). Order operations via `hibernate.order_updates=true`, `hibernate.order_inserts=true` for better batching potential (has performance cost). `IDENTITY` generators disable INSERT batching.
*   **Association Fetching (Crucial):** Avoid N+1 selects.
    *   Map most associations `fetch=LAZY` statically.
    *   Use *eager fetching dynamically* when data is needed:
        *   `join fetch` in HQL/JPQL (most common).
        *   Criteria API `fetch()`.
        *   Entity Graphs.
        *   Fetch Profiles (Hibernate specific).
    *   Avoid fetching multiple *collections* in parallel with joins (causes Cartesian products). Consider subselect fetching (`@Fetch(SUBSELECT)` or fetch profiles) or multiple queries.
    *   Map `@ManyToOne` to frequently cached "reference data" as `fetch=EAGER` with `@Fetch(SELECT)` (Hibernate specific) to avoid unnecessary joins but still fetch eagerly if missed in cache.
*   **Caching:**
    *   **First-Level Cache (Persistence Context):** Automatic, scoped to `Session`/`EntityManager`. Avoid long-lived sessions with many entities to prevent high memory usage. Use `clear()`/`evict()` or `StatelessSession` for bulk operations.
    *   **Second-Level Cache:** Shared, `SessionFactory`-level cache. Requires external provider (e.g., EHCache, Infinispan via `hibernate-jcache` or `infinispan-hibernate-cache-v60` modules) configured via `hibernate.cache.region.factory_class`.
        *   Enable globally: `hibernate.cache.use_second_level_cache=true`.
        *   Mark entities/collections cacheable: `@jakarta.persistence.Cacheable` (limited) or `@org.hibernate.annotations.Cache`.
        *   `@Cache(usage=CacheConcurrencyStrategy, region="...", include="...")`: Specifies strategy (`READ_ONLY`, `NONSTRICT_READ_WRITE`, `READ_WRITE`, `TRANSACTIONAL`), region name, and lazy property inclusion. Apply to root entity or collection mapping.
        *   Natural ID Cache: `@NaturalIdCache` on entity (requires `@Cache`). Caches natural ID -> PK mapping. Used by `Session#byNaturalId()`.
        *   Query Cache: Caches query results. Enable via `hibernate.cache.use_query_cache=true`. Mark individual queries cacheable (`query.setCacheable(true)`). Uses `default-query-results-region` and `default-update-timestamps-region`. Specify region via `query.setCacheRegion("...")`. Use with caution, often less effective than entity/collection caching.
        *   Cache Management: Control interaction per operation via `CacheMode` (Hibernate) or `CacheRetrieveMode`/`CacheStoreMode` (JPA). Evict entries via `sessionFactory.getCache().evictEntityData(...)`, etc.
*   **Locking:**
    *   **Optimistic:** Use `@Version` (preferred). Alternatives: `@OptimisticLocking(ALL/DIRTY)`.
    *   **Pessimistic:** Request via `LockMode`/`LockModeType` on `find()`, `lock()`, `refresh()`, or queries (`query.setLockMode()`). Modes: `PESSIMISTIC_READ` (`for share`), `PESSIMISTIC_WRITE` (`for update`), `PESSIMISTIC_FORCE_INCREMENT`. Use hints (`jakarta.persistence.lock.timeout`, `jakarta.persistence.lock.scope`).
*   **Statistics:** Enable via `hibernate.generate_statistics=true`. Access via `sessionFactory.getStatistics()`. Exposes counts for sessions, transactions, statements, entity/collection operations, cache hits/misses, query executions, etc.
*   **Java Flight Recorder (JFR):** Add `hibernate-jfr` module. Records detailed events (session open/close, JDBC operations, cache access, flushes).
*   **Slow Query Tracking:**
    *   `hibernate.log_slow_query`: Log queries exceeding specified millisecond threshold.
    *   `hibernate.use_sql_comments`: Prepend HQL/description to generated SQL. Add custom comments via `query.setComment()`.
*   **Indexes:** Define via `@Index` (in `@Table`, `@JoinTable`, etc.) or use external DDL management (recommended).
*   **Denormalized Data / Wide Tables:**
    *   Map multiple entities to the same table (careful with overlaps).
    *   Query into DTOs/Records instead of entities.
    *   Use attribute-level lazy fetching (`@Basic(fetch=LAZY)`) with bytecode enhancement.

This cheatsheet covers the core aspects and many advanced features described in the provided documentation. Refer to the specific sections for more detailed explanations and examples. Remember that ORM involves trade-offs, and understanding the underlying database and SQL is crucial for effective use.