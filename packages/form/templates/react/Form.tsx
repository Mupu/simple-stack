// Generated by simple:form

import {
	type FormValidator,
	mapObject,
	toSetValidationErrors,
	toSetFieldState,
	validateForm,
	type FormState,
} from "simple:form";
import {
	type ComponentProps,
	createContext,
	useContext,
	useState,
} from "react";

function getInitialFormState(formValidator: FormValidator): FormState {
	return {
		hasFieldErrors: false,
		fields: mapObject(formValidator, (_, validator) => ({
			hasErrored: false,
			validationErrors: undefined,
			validator,
		})),
	};
}

export function useCreateFormContext(validator: FormValidator) {
	const [formState, setFormState] = useState(getInitialFormState(validator));
	return {
		value: formState,
		set: setFormState,
		setValidationErrors: toSetValidationErrors(formState, setFormState),
		setFieldState: toSetFieldState(formState, setFormState),
	};
}

export function useFormContext() {
	const formContext = useContext(FormContext);
	if (!formContext) {
		throw new Error(
			"Form context not found. `useFormContext()` should only be called from children of a <Form> component.",
		);
	}
	return formContext;
}

type FormContextType = ReturnType<typeof useCreateFormContext>;

const FormContext = createContext<FormContextType | undefined>(undefined);

export function Form({
	children,
	validator,
	context,
	...formProps
}: {
	context?: FormContextType;
	validator: FormValidator;
} & Omit<ComponentProps<"form">, "method" | "onSubmit">) {
	const formContext = context ?? useCreateFormContext(validator);

	return (
		<FormContext.Provider value={formContext}>
			<form
				{...formProps}
				method="POST"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const parsed = validateForm(formData, validator);
					if (parsed.data) return;

					e.stopPropagation();
					formContext.setValidationErrors(parsed.fieldErrors);
				}}
			>
				{children}
			</form>
		</FormContext.Provider>
	);
}

export function Input(inputProps: ComponentProps<"input"> & { name: string }) {
	const formContext = useFormContext();
	const inputState = formContext.value.fields[inputProps.name];
	if (!inputState) {
		throw new Error(
			`Input "${inputProps.name}" not found in form. Did you use the <Form> component with your validator?`,
		);
	}

	const { hasErrored, validationErrors, validator } = inputState;

	function setValidation(inputValue: string) {
		const parsed = validator.safeParse(inputValue);
		if (parsed.success === false) {
			return formContext.setFieldState(inputProps.name, {
				hasErrored: true,
				validationErrors: parsed.error.errors.map((e) => e.message),
				validator,
			});
		}
		formContext.setFieldState(inputProps.name, {
			validationErrors: undefined,
			hasErrored,
			validator,
		});
	}

	return (
		<>
			<input
				{...inputProps}
				onBlur={(e) => {
					if (e.target.value === "") return;
					setValidation(e.target.value);
				}}
				onChange={(e) => {
					if (!hasErrored) return;
					setValidation(e.target.value);
				}}
			/>
			{validationErrors?.map((e) => (
				<p className="text-red-400" key={e}>
					{e}
				</p>
			))}
		</>
	);
}