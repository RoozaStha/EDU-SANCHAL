import * as Yup from 'yup';

export const classSchema = Yup.object().shape({
    class_text: Yup.string()
        .required('Class name is required')
        .max(50, 'Class name too long'),
    class_num: Yup.number()
        .required('Class number is required')
        .positive('Must be positive number')
        .integer('Must be whole number')
});