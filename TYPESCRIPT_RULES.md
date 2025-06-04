# TypeScript Code Modification Checklist

## Pre-Change Validation
1. ✓ Check existing type definitions in `/types` directory
2. ✓ Verify component prop interfaces
3. ✓ Review state management patterns
4. ✓ Identify data transformation requirements

## Change Implementation Steps

### 1. Type Safety Checks
```typescript
// STEP 1: Verify imports and type definitions
✓ Check for duplicate type definitions
✓ Ensure explicit type imports
✓ Avoid using 'any' type

// STEP 2: Validate component props
✓ Check prop interface completeness
✓ Verify optional vs required props
✓ Ensure proper event handler types

// STEP 3: Verify state management
✓ Confirm proper state initialization
✓ Check nullable state handling
✓ Validate state updates
```

### 2. Data Handling Validation
```typescript
// STEP 4: Data transformation checks
✓ Validate input data structure
✓ Implement type guards
✓ Handle edge cases

// STEP 5: Error handling verification
✓ Implement try-catch blocks
✓ Type-safe error handling
✓ Error propagation
```

### 3. Component Integration
```typescript
// STEP 6: Component setup validation
✓ Default props match interface
✓ Required props are enforced
✓ Optional props are handled

// STEP 7: Type guard implementation
✓ Use proper type guards
✓ Implement null checks
✓ Handle type narrowing
```

## Post-Change Validation

### 1. Code Review Checklist
- [ ] All variables have explicit types
- [ ] No type assertions using '!'
- [ ] No 'any' types used
- [ ] All props are properly typed
- [ ] Error handling is type-safe
- [ ] State updates maintain type safety

### 2. Common Patterns to Check

#### State Management
```typescript
// CORRECT:
const [data, setData] = useState<DealData | null>(null);

// INCORRECT:
const [data, setData] = useState(null);
```

#### Props Definition
```typescript
// CORRECT:
interface Props {
  onSubmit: (data: DealData) => Promise<void>;
  onError?: (error: Error) => void;
}

// INCORRECT:
interface Props {
  onSubmit: any;
  onError: any;
}
```

#### Data Transformation
```typescript
// CORRECT:
const transform = (input: unknown): DealData => {
  if (!isDealData(input)) {
    throw new Error('Invalid data');
  }
  return input;
};

// INCORRECT:
const transform = (input: any): any => {
  return input;
};
```

## Validation Rules by Component Type

### 1. Form Components
- Validate all input event handlers
- Check form submission types
- Verify form state management
- Ensure proper validation types

### 2. Data Display Components
- Verify prop types match data structure
- Check rendering conditions
- Validate transformation functions
- Ensure error boundary types

### 3. Container Components
- Check state management types
- Verify API integration types
- Validate child prop types
- Ensure context types

## Error Prevention Checklist

### 1. Type Definition
- [ ] No duplicate interfaces
- [ ] All required fields marked
- [ ] Optional fields properly marked
- [ ] Union types properly defined

### 2. Component Props
- [ ] Props interface defined
- [ ] Required props marked
- [ ] Optional props marked with '?'
- [ ] Event handlers properly typed

### 3. State Management
- [ ] Initial state typed
- [ ] State updates type-safe
- [ ] Async state handled
- [ ] Loading states typed

### 4. Error Handling
- [ ] Error types defined
- [ ] Try-catch blocks typed
- [ ] Error boundaries typed
- [ ] Error state managed

## Implementation Examples

### 1. State Updates
```typescript
// CORRECT
const [state, setState] = useState<DealData>(() => ({
  propertyName: '',
  totalUnits: 0,
  // ... all required fields
}));

// INCORRECT
const [state, setState] = useState({});
```

### 2. Event Handlers
```typescript
// CORRECT
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setState({ ...state, [e.target.name]: e.target.value });
};

// INCORRECT
const handleChange = (e) => {
  setState({ ...state, [e.target.name]: e.target.value });
};
```

### 3. API Integration
```typescript
// CORRECT
interface APIResponse<T> {
  data: T;
  error?: string;
}

async function fetchData(): Promise<APIResponse<DealData>> {
  // implementation
}

// INCORRECT
async function fetchData() {
  // implementation
}
```

## Maintenance Rules

### 1. Type Updates
- Document all type changes
- Update dependent components
- Verify backwards compatibility
- Test type changes

### 2. Component Updates
- Check prop type changes
- Verify state type updates
- Validate event handler changes
- Test component integration

### 3. Data Flow
- Verify data transformation
- Check API integration
- Validate state updates
- Test error handling 