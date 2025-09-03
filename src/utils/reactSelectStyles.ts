 export const reactSelectStyles = {  control: (base: any, state: { isFocused: boolean }) => ({
        ...base,
        minHeight: '40px',
        background: 'hsl(var(--background))',
        borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--input))',
        borderWidth: '1px',
        boxShadow: state.isFocused ? `0 0 0 1px hsl(var(--ring))` : 'none',
        '&:hover': {
            borderColor: 'hsl(var(--input))',
        },
    }),
    valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
    input: (base: any) => ({ ...base, color: 'hsl(var(--foreground))', margin: '0', padding: '0' }),
    placeholder: (base: any) => ({ ...base, color: 'hsl(var(--muted-foreground))' }),
    singleValue: (base: any) => ({ ...base, color: 'hsl(var(--foreground))' }),
    menu: (base: any) => ({
        ...base,
        background: 'hsl(var(--popover))',
        color: 'hsl(var(--popover-foreground))',
        borderRadius: 'var(--radius)',
        border: '1px solid hsl(var(--border))',
        zIndex: 50,
    }),
    option: (base: any, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...base,
        background: state.isSelected ? 'hsl(var(--accent))' : state.isFocused ? 'hsl(var(--accent))' : 'transparent',
        color: 'hsl(var(--accent-foreground))',
        cursor: 'pointer',
    }), };