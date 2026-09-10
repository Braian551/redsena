package com.redsena.demo.shared.exception;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import java.util.Map;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.stereotype.Component;
import com.redsena.demo.shared.web.RequestIdContext;

@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter {

	@Override
	protected GraphQLError resolveToSingleError(Throwable exception, DataFetchingEnvironment environment) {
		ApiException apiException = exception instanceof ApiException known
				? known
				: new ApiException("INTERNAL_ERROR", "Ocurrió un error interno.");
		return GraphqlErrorBuilder.newError(environment)
				.message(apiException.getMessage())
				.extensions(Map.of(
						"code", apiException.code(),
						"requestId", RequestIdContext.current()))
				.build();
	}
}
