import React, { useState, useRef, useEffect } from 'react';
import { User, X } from 'lucide-react';
import { Employee } from '../types';

interface Props {
  employees: Employee[];
  value: string; // employeeId
  onChange: (employeeId: string) => void;
  placeholder?: string;
}

export default function EmployeeAutocomplete({ employees, value, onChange, placeholder }: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedEmployee = employees.find(e => e.id === value);

  useEffect(() => {
    if (selectedEmployee) {
      setSearch(selectedEmployee.fullName);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (emp.position && emp.position.toLowerCase().includes(search.toLowerCase())) ||
    (emp.department && emp.department.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (emp: Employee) => {
    onChange(emp.id);
    setSearch(emp.fullName);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || 'Начните вводить ФИО...'}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm pr-8"
        />
        {search && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && filteredEmployees.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredEmployees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => handleSelect(emp)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{emp.fullName}</div>
                  {(emp.position || emp.department) && (
                    <div className="text-xs text-gray-500">
                      {emp.position && <span>{emp.position}</span>}
                      {emp.position && emp.department && <span> · </span>}
                      {emp.department && <span>{emp.department}</span>}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
