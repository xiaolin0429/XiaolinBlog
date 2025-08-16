"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DialogToolProps } from '../../types/tool-types';
import { TableData } from './TableTool';

export function TableDialog({ open, onOpenChange, onConfirm, initialData }: DialogToolProps) {
  const [formData, setFormData] = useState<TableData>({
    rows: 3,
    columns: 3,
    headers: ['列1', '列2', '列3'],
    includeHeader: true,
    alignment: 'left'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rows > 0 && formData.columns > 0) {
      onConfirm(formData);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleColumnsChange = (columns: number) => {
    const newHeaders = Array(columns).fill(0).map((_, i) => 
      formData.headers[i] || `列${i + 1}`
    );
    setFormData(prev => ({ ...prev, columns, headers: newHeaders }));
  };

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...formData.headers];
    newHeaders[index] = value;
    setFormData(prev => ({ ...prev, headers: newHeaders }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>插入表格</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="table-rows">行数</Label>
              <Input
                id="table-rows"
                type="number"
                min="1"
                max="20"
                value={formData.rows}
                onChange={(e) => setFormData(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-columns">列数</Label>
              <Input
                id="table-columns"
                type="number"
                min="1"
                max="10"
                value={formData.columns}
                onChange={(e) => handleColumnsChange(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-header"
              checked={formData.includeHeader}
              onCheckedChange={(checked: boolean) => 
                setFormData(prev => ({ ...prev, includeHeader: checked }))
              }
            />
            <Label htmlFor="include-header">包含表头</Label>
          </div>
          
          {formData.includeHeader && (
            <div className="space-y-2">
              <Label>表头设置</Label>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(formData.columns, 3)}, 1fr)` }}>
                {formData.headers.slice(0, formData.columns).map((header, index) => (
                  <Input
                    key={index}
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    placeholder={`列${index + 1}`}
                  />
                ))}
              </div>
              {formData.columns > 3 && (
                <p className="text-sm text-muted-foreground">
                  还有 {formData.columns - 3} 列将使用默认名称
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="table-alignment">对齐方式</Label>
            <Select
              value={formData.alignment}
              onValueChange={(value: 'left' | 'center' | 'right') => 
                setFormData(prev => ({ ...prev, alignment: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择对齐方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">左对齐</SelectItem>
                <SelectItem value="center">居中对齐</SelectItem>
                <SelectItem value="right">右对齐</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button type="submit">
              插入表格
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}