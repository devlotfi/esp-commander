import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  Form,
  Label,
  ListBox,
  Modal,
  Select,
  Slider,
  Switch,
  type UseOverlayStateReturn,
} from "@heroui/react";
import {
  ValueType,
  type HandlerData,
  type IOTCAction,
  type Value,
} from "../../types/handler-call";
import { useFormik } from "formik";
import * as yup from "yup";
import ValidatedTextField from "../validated-text-field";
import { DynamicIcon } from "lucide-react/dynamic";
import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";

function setupInitialValues(action: IOTCAction): HandlerData {
  if (!action.parameters) return {};
  const actionData: HandlerData = {};
  for (const parameter of action.parameters) {
    switch (parameter.type) {
      case ValueType.INT:
        actionData[parameter.name] = "";
        break;
      case ValueType.RANGE:
        actionData[parameter.name] = 0;
        break;
      case ValueType.FLOAT:
        actionData[parameter.name] = "";
        break;
      case ValueType.DOUBLE:
        actionData[parameter.name] = "";
        break;
      case ValueType.BOOL:
        actionData[parameter.name] = false;
        break;
      case ValueType.STRING:
        actionData[parameter.name] = "";
        break;
      case ValueType.ENUM:
        actionData[parameter.name] = "";
        break;
      case ValueType.COLOR:
        actionData[parameter.name] = "#ffffff";
        break;
    }
  }

  return actionData;
}

function setupYupSchema(action: IOTCAction) {
  if (!action.parameters) return {};
  const yupObj: Record<string, yup.AnySchema> = {};
  for (const parameter of action.parameters) {
    let schema: yup.AnySchema | undefined;

    switch (parameter.type) {
      case ValueType.INT:
        schema = yup.number().integer();
        break;
      case ValueType.RANGE:
        schema = yup
          .number()
          .integer()
          .min(parameter.min || 0)
          .max(parameter.max || 0);
        break;
      case ValueType.FLOAT:
        schema = yup.number();
        break;
      case ValueType.DOUBLE:
        schema = yup.number();
        break;
      case ValueType.BOOL:
        schema = yup.boolean();
        break;
      case ValueType.STRING:
        schema = yup.string();
        break;
      case ValueType.ENUM:
        if (parameter.enumDefinition) {
          schema = yup
            .string()
            .oneOf([...parameter.enumDefinition])
            .required();
        }
        break;
      case ValueType.COLOR:
        schema = yup.string();
        break;
    }

    if (!schema) continue;
    yupObj[parameter.name] = parameter.required ? schema.required() : schema;
  }

  return yup.object(yupObj);
}

function FieldLabel({ parameter }: { parameter: Value }) {
  return (
    <span>
      <span className="mr-[0.3rem] text-accent">{parameter.type}</span>
      <span>{parameter.name}</span>
    </span>
  );
}

interface ActionParamsModalProps {
  state: UseOverlayStateReturn;
  action: IOTCAction;
  onSubmit: (actionData: HandlerData) => void;
}

export default function ActionParamsModal({
  state,
  action,
  onSubmit,
}: ActionParamsModalProps) {
  const { t } = useTranslation();

  const formik = useFormik({
    initialValues: setupInitialValues(action),
    validationSchema: setupYupSchema(action),
    onSubmit(values) {
      onSubmit(values);
    },
  });

  function renderFields() {
    if (!action.parameters) return;
    return action.parameters.map((parameter, index) => {
      switch (parameter.type) {
        case ValueType.INT:
          return (
            <ValidatedTextField
              key={`${parameter.name}-${index}`}
              formik={formik}
              name={parameter.name}
              textFieldProps={{ isRequired: true }}
              labelProps={{
                children: <FieldLabel parameter={parameter}></FieldLabel>,
              }}
              inputProps={{
                type: "number",
                step: "1",
              }}
            ></ValidatedTextField>
          );
        case ValueType.RANGE:
          return (
            <Slider
              key={`${parameter.name}-${index}`}
              aria-label="slider"
              minValue={parameter.min}
              maxValue={parameter.max}
              value={+formik.values[parameter.name]}
              onChange={(value) => formik.setFieldValue(parameter.name, value)}
            >
              <FieldLabel parameter={parameter}></FieldLabel>
              <Slider.Output />
              <Slider.Track>
                <Slider.Fill />
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
          );
        case ValueType.FLOAT:
          return (
            <ValidatedTextField
              key={`${parameter.name}-${index}`}
              formik={formik}
              name={parameter.name}
              textFieldProps={{ isRequired: true }}
              labelProps={{
                children: <FieldLabel parameter={parameter}></FieldLabel>,
              }}
              inputProps={{
                type: "number",
                step: "0.01",
              }}
            ></ValidatedTextField>
          );
        case ValueType.DOUBLE:
          return (
            <ValidatedTextField
              key={`${parameter.name}-${index}`}
              formik={formik}
              name={parameter.name}
              textFieldProps={{ isRequired: true }}
              labelProps={{
                children: <FieldLabel parameter={parameter}></FieldLabel>,
              }}
              inputProps={{
                type: "number",
                step: "0.01",
              }}
            ></ValidatedTextField>
          );
        case ValueType.BOOL:
          return (
            <Switch
              key={`${parameter.name}-${index}`}
              isSelected={formik.values[parameter.name] as boolean}
              onChange={(value) => formik.setFieldValue(parameter.name, value)}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label className="text-sm">
                <FieldLabel parameter={parameter}></FieldLabel>
              </Label>
            </Switch>
          );
        case ValueType.STRING:
          return (
            <ValidatedTextField
              key={`${parameter.name}-${index}`}
              formik={formik}
              name={parameter.name}
              textFieldProps={{ isRequired: true }}
              labelProps={{
                children: <FieldLabel parameter={parameter}></FieldLabel>,
              }}
            ></ValidatedTextField>
          );
        case ValueType.ENUM:
          if (parameter.enumDefinition) {
            return (
              <Select
                key={`${parameter.name}-${index}`}
                isInvalid={formik.errors[parameter.name] !== undefined}
                value={formik.values[parameter.name] as string}
                onChange={(value) =>
                  formik.setFieldValue(parameter.name, value?.toString())
                }
              >
                <Label>
                  <FieldLabel parameter={parameter}></FieldLabel>
                </Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {parameter.enumDefinition.map((enumValue) => (
                      <ListBox.Item
                        key={enumValue}
                        id={enumValue}
                        textValue={enumValue}
                      >
                        {enumValue}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>

                {formik.errors[parameter.name] ? (
                  <div className="ml-[0.3rem] text-danger text-[9pt]">
                    {formik.errors[parameter.name]}
                  </div>
                ) : null}
              </Select>
            );
          }
          break;
        case ValueType.COLOR:
          return (
            <ColorField key={`${parameter.name}-${index}`} aria-label="color">
              <FieldLabel parameter={parameter}></FieldLabel>
              <ColorField.Group>
                <ColorField.Prefix>
                  <ColorPicker
                    onChange={(value) =>
                      formik.setFieldValue(
                        parameter.name,
                        value?.toString("hex"),
                      )
                    }
                  >
                    <ColorPicker.Trigger>
                      <ColorSwatch
                        size="sm"
                        color={
                          /^#[0-9A-F]{6}$/i.test(
                            formik.values[parameter.name] as string,
                          )
                            ? (formik.values[parameter.name] as string)
                            : undefined
                        }
                      />
                    </ColorPicker.Trigger>
                    <ColorPicker.Popover className="gap-2">
                      <ColorArea
                        aria-label="Color area"
                        className="max-w-full"
                        colorSpace="hsb"
                        xChannel="saturation"
                        yChannel="brightness"
                      >
                        <ColorArea.Thumb />
                      </ColorArea>

                      <ColorSlider
                        aria-label="Hue slider"
                        channel="hue"
                        className="flex-1"
                        colorSpace="hsb"
                      >
                        <ColorSlider.Track>
                          <ColorSlider.Thumb />
                        </ColorSlider.Track>
                      </ColorSlider>
                    </ColorPicker.Popover>
                  </ColorPicker>
                </ColorField.Prefix>
                <ColorField.Input
                  value={formik.values[parameter.name] as string}
                  onChange={(e) =>
                    formik.setFieldValue(parameter.name, e.target.value)
                  }
                />
              </ColorField.Group>
            </ColorField>
          );
      }
    });
  }

  return (
    <Modal.Backdrop
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      variant="blur"
    >
      <Modal.Container placement="center">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <DynamicIcon name="variable" className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{t("parameters")}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="p-[0.3rem]">
            <Form
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-[0.5rem]"
            >
              {renderFields()}

              <Button fullWidth type="submit" className="mt-[1rem]">
                {t("send")}

                <Play></Play>
              </Button>
            </Form>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
