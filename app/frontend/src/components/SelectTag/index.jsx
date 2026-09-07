import { Select } from 'antd';

export default function SelectTag({ options, defaultValue, translate = (l) => l }) {
  return (
    <Select
      defaultValue={defaultValue}
      style={{
        width: '100%',
      }}
    >
      {options?.map((option, idx) => {
        if (option && typeof option === 'object')
          return (
            <Select.Option key={option.value || idx} value={option.value}>
              {translate(option.label)}
            </Select.Option>
          );
        else
          return (
            <Select.Option key={option || idx} value={option}>
              {option}
            </Select.Option>
          );
      })}
    </Select>
  );
}
