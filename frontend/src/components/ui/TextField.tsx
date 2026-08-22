import { TextInput, TextInputProps, View } from "react-native";

import { useTheme } from "../../ThemeProvider";
import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
  className?: string;
};

export function TextField({
  label,
  error,
  className = "",
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View className={`mb-md ${className}`.trim()}>
      {label ? (
        <AppText variant="label" className="mb-xxs">
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        className="rounded-md border border-border bg-elevated px-md py-md text-body text-ink"
        {...rest}
      />
      {error ? (
        <AppText variant="caption" className="mt-xxs text-danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
