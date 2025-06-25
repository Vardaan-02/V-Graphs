CREATE TABLE executions (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            workflow_id UUID NOT NULL,
                            owner_id UUID NOT NULL,
                            status VARCHAR(50) NOT NULL,
                            input_data JSONB,
                            output_data JSONB,
                            error TEXT,
                            started_at TIMESTAMP WITH TIME ZONE NOT NULL,
                            completed_at TIMESTAMP WITH TIME ZONE,

                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT fk_workflow_exec FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
                            CONSTRAINT fk_user_exec FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
