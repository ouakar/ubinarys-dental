import dayjs from 'dayjs';
import { Switch, Tag } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { countryList } from '@/utils/countryList';
import { generate as uniqueId } from 'shortid';
import color from '@/utils/color';

export const dataForRead = ({ fields, translate }) => {
  let columns = [];

  Object.keys(fields).forEach((key) => {
    let field = fields[key];
    columns.push({
      title: field.title || field.label || translate(key),
      dataIndex: Array.isArray(field.dataIndex) ? field.dataIndex.join('.') : field.dataIndex || key,
      isDate: field.type === 'date',
    });
  });

  return columns;
};

export function dataForTable({ fields, translate, moneyFormatter, dateFormat }) {
  let columns = [];

    const fieldsArray = Array.isArray(fields)
      ? fields
      : Object.keys(fields).map((key) => ({ ...fields[key], key }));

    fieldsArray.forEach((field) => {
      const key = field.key || field.dataIndex;
      const title = field.title || field.label || translate(key);

      const component = {
        boolean: {
          title: title,
          dataIndex: key,
          onCell: () => ({
            props: {
              style: {
                width: '60px',
              },
            },
          }),
          render: (value, record) => (
            <Switch
              checked={value}
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
            />
          ),
        },
        date: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            const date = dayjs(value).format(dateFormat);
            return (
              <Tag bordered={false} color={field.color}>
                {date}
              </Tag>
            );
          },
        },
        currency: {
          title: title,
          dataIndex: key,
          onCell: () => {
            return {
              style: {
                textAlign: 'right',
                whiteSpace: 'nowrap',
              },
            };
          },
          render: (value, record) =>
            moneyFormatter({ amount: value, currency_code: record.currency }),
        },
        async: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            return (
              <Tag bordered={false} color={field.color || value?.color || record.color}>
                {value}
              </Tag>
            );
          },
        },
        color: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            return (
              <Tag bordered={false} color={value}>
                {color.find((x) => x.value === value)?.label}
              </Tag>
            );
          },
        },
        stringWithColor: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            return (
              <Tag bordered={false} color={record.color || field.color}>
                {value}
              </Tag>
            );
          },
        },
        tag: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            return (
              <Tag bordered={false} color={field.color}>
                {value && value}
              </Tag>
            );
          },
        },
        selectWithFeedback: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            if (field.renderAsTag) {
              const selectedOption = field.options.find((x) => x.value === value);

              return (
                <Tag bordered={false} color={selectedOption?.color}>
                  {value && translate(value)}
                </Tag>
              );
            } else return value && translate(value);
          },
        },
        select: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            if (field.renderAsTag) {
              const selectedOption = field.options.find((x) => x.value === value);

              return (
                <Tag bordered={false} color={selectedOption?.color}>
                  {value && value}
                </Tag>
              );
            } else return value && value;
          },
        },
        selectWithTranslation: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            if (field.renderAsTag) {
              const selectedOption = field.options.find((x) => x.value === value);

              return (
                <Tag bordered={false} color={selectedOption?.color}>
                  {value && translate(value)}
                </Tag>
              );
            } else return value && translate(value);
          },
        },
        array: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            return (value || []).map((x) => (
              <Tag bordered={false} key={`${uniqueId()}`} color={field.colors[x]}>
                {x}
              </Tag>
            ));
          },
        },
        country: {
          title: title,
          dataIndex: key,
          render: (value, record) => {
            const selectedCountry = countryList.find((obj) => obj.value === value);

            return (
              <Tag bordered={false} color={field.color || undefined}>
                {selectedCountry?.icon && selectedCountry?.icon + ' '}
                {selectedCountry?.label && translate(selectedCountry.label)}
              </Tag>
            );
          },
        },
      };

      const defaultComponent = {
        title: title,
        dataIndex: key,
        render: field.render,
      };

      const type = field.type;

      if (!field.disableForTable) {
        Object.keys(component).includes(type)
          ? columns.push({ ...component[type], ...field, title })
          : columns.push({ ...defaultComponent, title });
      }
    });

  return columns;
}

function getRandomColor() {
  const colors = [
    'magenta',
    'red',
    'volcano',
    'orange',
    'gold',
    'lime',
    'green',
    'cyan',
    'blue',
    'geekblue',
    'purple',
  ];

  // Generate a random index between 0 and the length of the colors array
  const randomIndex = Math.floor(Math.random() * colors.length);

  // Return the color at the randomly generated index
  return colors[randomIndex];
}
