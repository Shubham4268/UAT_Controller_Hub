import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { PREDEFINED_TEMPLATES, DEFAULT_CUSTOM_FIELDS, IssueTemplate, TemplateField, FieldType } from '@/config/templates';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface TemplateBuilderProps {
    onChange: (template: IssueTemplate) => void;
}

export function TemplateBuilder({ onChange }: TemplateBuilderProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('namo_revamp');
    const [customFields, setCustomFields] = useState<TemplateField[]>(DEFAULT_CUSTOM_FIELDS);

    // Initial load
    useEffect(() => {
        handleTemplateChange('namo_revamp');
    }, []);

    const handleTemplateChange = (id: string) => {
        setSelectedTemplateId(id);
        if (id === 'custom') {
            onChange({
                id: 'custom',
                name: 'Custom Template',
                fields: customFields
            });
        } else {
            const template = PREDEFINED_TEMPLATES.find(t => t.id === id);
            if (template) {
                onChange(template);
            }
        }
    };

    const updateCustomField = (index: number, updates: Partial<TemplateField>) => {
        const newFields = [...customFields];
        newFields[index] = { ...newFields[index], ...updates };
        setCustomFields(newFields);
        onChange({
            id: 'custom',
            name: 'Custom Template',
            fields: newFields
        });
    };

    const addCustomField = () => {
        const newField: TemplateField = {
            key: `field_${Date.now()}`,
            label: 'New Field',
            type: 'text',
            required: false
        };
        const newFields = [...customFields, newField];
        setCustomFields(newFields);
        onChange({
            id: 'custom',
            name: 'Custom Template',
            fields: newFields
        });
    };

    const removeCustomField = (index: number) => {
        const newFields = customFields.filter((_, i) => i !== index);
        setCustomFields(newFields);
        onChange({
            id: 'custom',
            name: 'Custom Template',
            fields: newFields
        });
    };

    const currentTemplate = selectedTemplateId === 'custom' 
        ? { id: 'custom', name: 'Custom Template', fields: customFields }
        : PREDEFINED_TEMPLATES.find(t => t.id === selectedTemplateId);

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <div className="space-y-2">
                <Label>Issue Field Template</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                        {PREDEFINED_TEMPLATES.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground uppercase font-bold">Files Configuration</Label>
                    {selectedTemplateId === 'custom' && (
                        <Button type="button" size="sm" variant="outline" onClick={addCustomField} className="h-7 text-xs gap-1">
                            <Plus className="h-3 w-3" /> Add Field
                        </Button>
                    )}
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Label</TableHead>
                                <TableHead className="w-[120px]">Type</TableHead>
                                <TableHead className="w-[80px] text-center">Req.</TableHead>
                                {selectedTemplateId === 'custom' && <TableHead className="w-[150px]">Options (Select)</TableHead>}
                                {selectedTemplateId === 'custom' && <TableHead className="w-[50px]"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentTemplate?.fields.map((field, index) => (
                                <TableRow key={field.key}>
                                    <TableCell>
                                        {selectedTemplateId === 'custom' ? (
                                            <Input 
                                                value={field.label} 
                                                onChange={(e) => updateCustomField(index, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                                className="h-8 text-sm"
                                            />
                                        ) : (
                                            <span className="font-medium text-sm">{field.label}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {selectedTemplateId === 'custom' ? (
                                             <Select 
                                                value={field.type} 
                                                onValueChange={(val) => updateCustomField(index, { type: val as FieldType })}
                                             >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="textarea">Text Area</SelectItem>
                                                    <SelectItem value="select">Dropdown</SelectItem>
                                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                                    <SelectItem value="url">URL</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] font-normal">{field.type}</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {selectedTemplateId === 'custom' ? (
                                            <Checkbox 
                                                checked={field.required} 
                                                onCheckedChange={(checked) => updateCustomField(index, { required: !!checked })}
                                            />
                                        ) : (
                                            field.required && <Badge variant="secondary" className="text-[10px]">Req</Badge>
                                        )}
                                    </TableCell>
                                    {selectedTemplateId === 'custom' && (
                                        <TableCell>
                                            {field.type === 'select' ? (
                                                <Input 
                                                    placeholder="Opt1, Opt2..." 
                                                    value={field.options?.join(', ') || ''}
                                                    onChange={(e) => updateCustomField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                    className="h-8 text-xs"
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground px-2">-</span>
                                            )}
                                        </TableCell>
                                    )}
                                    {selectedTemplateId === 'custom' && (
                                        <TableCell>
                                            <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => removeCustomField(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
