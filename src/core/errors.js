class AppError extends Error{constructor(message,code='INTERNAL',status=500){super(message);this.name='AppError';this.code=code;this.status=status;}}
class UserInputError extends AppError{constructor(message){super(message,'BAD_INPUT',400)}}
class PermissionError extends AppError{constructor(message='You do not have permission for this action.'){super(message,'FORBIDDEN',403)}}
module.exports={AppError,UserInputError,PermissionError};
